import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/authContext';
import { db, storage } from '../scripts/firebaseConfig';

export default function EditPostScreen() {
  const { id, content: initialContent, images: initialImages } = useLocalSearchParams();
  const { user } = useAuth();
  
  const [content, setContent] = useState(decodeURIComponent(initialContent as string || ''));
  const [images, setImages] = useState<string[]>(
    initialImages ? JSON.parse(decodeURIComponent(initialImages as string)) : []
  );
  const [uploading, setUploading] = useState(false);

  // 이미지를 Firebase Storage에 업로드 (write.tsx와 동일)
  const uploadImageToStorage = async (imageUri: string, index: number): Promise<string> => {
    try {
      // 이미 Firebase Storage URL인 경우 그대로 반환
      if (imageUri.startsWith('https://firebasestorage.googleapis.com')) {
        return imageUri;
      }

      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const timestamp = Date.now();
      const filename = `posts/${user?.uid}/${timestamp}_${index}.jpg`;
      
      const storageRef = ref(storage, filename);
      await uploadBytes(storageRef, blob);
      
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

  // 게시글 수정 저장
  const handleUpdate = async () => {
    if (images.length === 0 || !content.trim()) {
      Alert.alert('알림', '사진과 내용을 모두 입력해주세요.');
      return;
    }

    if (!user || !id) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    setUploading(true);
    try {
      // 새로 추가된 이미지만 업로드
      const uploadPromises = images.map((imageUri, index) => 
        uploadImageToStorage(imageUri, index)
      );
      
      const uploadedImageUrls = await Promise.all(uploadPromises);

      await updateDoc(doc(db, 'posts', id as string), {
        content: content.trim(),
        images: uploadedImageUrls,
        updatedAt: serverTimestamp(),
      });

      Alert.alert('수정 완료', '게시글이 수정되었습니다.', [
        {
          text: '확인',
          onPress: () => router.replace('/'),
        },
      ]);
    } catch (error) {
      console.error('게시글 수정 중 오류 발생:', error);
      Alert.alert('오류', '게시글 수정에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setUploading(false);
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.scrollContainer}>
          
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

          <View style={styles.buttonRow}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={() => router.back()}
              disabled={uploading}
            >
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton]} 
              onPress={handleUpdate}
              disabled={uploading}
            >
              {uploading ? (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#fff" />
                  <Text style={styles.uploadingText}>업로드 중...</Text>
                </View>
              ) : (
                <Text style={styles.saveButtonText}>수정 완료</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  scrollContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginTop: 16 
  },
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
