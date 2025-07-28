import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/authContext';
import { db, storage } from '../scripts/firebaseConfig';

export default function WriteScreen() {
  const { user } = useAuth();
  const [images, setImages] = useState<string[]>([]);
  const [content, setContent] = useState('');
  const [uploading, setUploading] = useState(false);

  // 이미지를 Firebase Storage에 업로드
  const uploadImageToStorage = async (imageUri: string, index: number): Promise<string> => {
    try {
      // 이미지를 blob으로 변환
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // 고유한 파일명 생성
      const timestamp = Date.now();
      const filename = `posts/${user?.uid}/${timestamp}_${index}.jpg`;
      
      // Firebase Storage에 업로드
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      
      // 다운로드 URL 가져오기
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error('이미지 업로드 오류:', error);
      throw error;
    }
  };

  // 갤러리에서 사진 선택
  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 선택할 수 있습니다.');
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 3 - images.length,
        quality: 0.5,
      });

      if (!result.canceled) {
        const newUris = result.assets.map(asset => asset.uri);
        setImages([...images, ...newUris].slice(0, 3));
      }
    } catch (error) {
      console.error('갤러리 선택 오류:', error);
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  // 카메라로 사진 촬영
  const takePhoto = async () => {
    if (images.length >= 3) {
      Alert.alert('알림', '사진은 최대 3장까지 선택할 수 있습니다.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.5,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setImages([...images, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('카메라 촬영 오류:', error);
      Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // 사진 삭제
  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (images.length === 0 || !content.trim()) {
      Alert.alert('알림', '사진과 내용을 모두 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setUploading(true);
    try {
      // 모든 이미지를 Firebase Storage에 업로드
      const uploadPromises = images.map((imageUri, index) => 
        uploadImageToStorage(imageUri, index)
      );
      
      const uploadedImageUrls = await Promise.all(uploadPromises);
      
      // Firestore에 게시글 저장 (업로드된 URL들과 함께)
      await addDoc(collection(db, 'posts'), {
        authorUid: user.uid,
        authorName: user.displayName || user.email,
        content: content.trim(),
        images: uploadedImageUrls, // 로컬 경로 대신 Firebase Storage URL
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        commentCount: 0
      });

      Alert.alert('작성 완료', '게시글이 등록되었습니다.');
      setImages([]);
      setContent('');
      router.replace('/');
    } catch (error) {
      console.error('게시글 저장 중 오류 발생:', error);
      Alert.alert('오류', '게시글 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>사진 (최대 3장)</Text>
      <View style={styles.imageRow}>
        {images.map((uri, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity style={styles.removeButton} onPress={() => removeImage(idx)}>
              <Text style={styles.removeButtonText}>X</Text>
            </TouchableOpacity>
          </View>
        ))}
        {images.length < 3 && (
          <View style={styles.addButtons}>
            <TouchableOpacity style={styles.addButton} onPress={pickImage}>
              <Text style={styles.addButtonText}>갤러리</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addButton} onPress={takePhoto}>
              <Text style={styles.addButtonText}>카메라</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.label}>내용</Text>
      <TextInput
        style={[styles.input, { height: 120 }]}
        value={content}
        onChangeText={setContent}
        placeholder="내용을 입력하세요"
        multiline
        editable={!uploading}
      />

      <TouchableOpacity
        style={[styles.submitButton, uploading && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={uploading}
      >
        {uploading ? (
          <View style={styles.uploadingContainer}>
            <ActivityIndicator size="small" color="#fff" />
            <Text style={styles.uploadingText}>업로드 중...</Text>
          </View>
        ) : (
          <Text style={styles.submitButtonText}>등록</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  label: { fontSize: 16, fontWeight: 'bold', marginTop: 16 },
  imageRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 8,
    alignItems: 'center',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#ff4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  addButtons: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 6,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    backgroundColor: '#fafafa',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonDisabled: {
    backgroundColor: '#ccc',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  uploadingText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
});