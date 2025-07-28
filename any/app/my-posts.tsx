import { FontAwesome } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { collection, deleteDoc, doc, getDocs, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/authContext';
import { db } from '../scripts/firebaseConfig';

interface Post {
  id: string;
  authorName: string;
  content: string;
  images: string[];
  createdAt: any;
  commentCount: number;
  authorUid: string;
}

export default function MyPostsScreen() {
  const { mode } = useLocalSearchParams(); // 'edit' 또는 'delete'
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null); // 삭제 중인 게시글 ID

  const isEditMode = mode === 'edit';
  const isDeleteMode = mode === 'delete';

  // 본인 게시글만 불러오기
  const fetchMyPosts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'posts'),
        where('authorUid', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        postsData.push({
          id: doc.id,
          ...doc.data()
        } as Post);
      });
      
      setPosts(postsData);
    } catch (error) {
      console.error('내 게시글 불러오기 오류:', error);
      Alert.alert('오류', '게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPosts();
  }, [user]);

  // 날짜 포맷 함수
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // 게시글 수정
  const handleEdit = (post: Post) => {
    router.push(`/edit-post?id=${post.id}&content=${encodeURIComponent(post.content)}&images=${encodeURIComponent(JSON.stringify(post.images))}`);
  };

  // 게시글 삭제
  const handleDelete = async (post: Post) => {
    Alert.alert(
      '게시글 삭제',
      `"${post.content.substring(0, 20)}${post.content.length > 20 ? '...' : ''}" 게시글을 삭제하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setDeleting(post.id);
            try {
              await deleteDoc(doc(db, 'posts', post.id));
              Alert.alert('삭제 완료', '게시글이 삭제되었습니다.');
              // 목록에서 제거
              setPosts(posts.filter(p => p.id !== post.id));
            } catch (error) {
              console.error('게시글 삭제 오류:', error);
              Alert.alert('오류', '게시글 삭제에 실패했습니다.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>로그인이 필요합니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>내 게시글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {posts.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.emptyText}>작성한 게시글이 없습니다.</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.item}
              onPress={() => {
                if (isEditMode) {
                  handleEdit(item);
                } else if (isDeleteMode) {
                  handleDelete(item);
                }
              }}
              disabled={deleting === item.id}
            >
              <View style={styles.itemContent}>
                {/* 이미지 */}
                {item.images && item.images.length > 0 && item.images[0] ? (
                  <Image 
                    source={{ uri: item.images[0] }} 
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.noImagePlaceholder}>
                    <Text style={styles.noImageText}>📷</Text>
                  </View>
                )}

                {/* 내용 */}
                <View style={styles.textContent}>
                  <Text style={styles.content} numberOfLines={2}>
                    {item.content}
                  </Text>
                  <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                </View>

                {/* 액션 아이콘 */}
                <View style={styles.actionContainer}>
                  {deleting === item.id ? (
                    <ActivityIndicator size="small" color="#FF3B30" />
                  ) : (
                    <FontAwesome 
                      name={isEditMode ? "edit" : "trash"} 
                      size={20} 
                      color={isEditMode ? "#007AFF" : "#FF3B30"} 
                    />
                  )}
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 36, // backButton과 같은 크기
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 16,
  },
  item: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  noImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 20,
    color: '#999',
  },
  textContent: {
    flex: 1,
    marginLeft: 12,
  },
  content: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  actionContainer: {
    padding: 8,
  },
});
