import { useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
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

const PostList = () => {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Firestore에서 게시글 불러오기
  const fetchPosts = async () => {
    try {
      const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
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
      console.error('게시글 불러오기 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>아직 게시글이 없습니다.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            router.push(`/post-list-detail/${item.id}`);
          }}
        >
          {/* 1. 유저 이름 */}
          <Text style={styles.username}>{item.authorName}</Text>
          
          {/* 2. 게시글 첫 번째 사진 - 안전한 처리 */}
          {item.images && 
           item.images.length > 0 && 
           item.images[0] && 
           item.images[0].trim() !== '' && (
            <Image 
              source={{ uri: item.images[0] }} 
              style={styles.thumbnail}
              resizeMode="cover"
              onError={(error) => {
                console.log('이미지 로드 실패:', error.nativeEvent.error);
              }}
            />
          )}
          
          {/* 이미지가 없을 때 플레이스홀더 */}
          {(!item.images || 
            item.images.length === 0 || 
            !item.images[0] || 
            item.images[0].trim() === '') && (
            <View style={styles.noImagePlaceholder}>
              <Text style={styles.noImageText}>📷</Text>
              <Text style={styles.noImageText}>이미지 없음</Text>
            </View>
          )}
          
          {/* 3. 게시글 내용 */}
          <Text style={styles.content} numberOfLines={3}>
            {item.content}
          </Text>
          
          {/* 4. 날짜 + 댓글수 */}
          <View style={styles.infoRow}>
            <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
            <Text style={styles.commentCount}>댓글 {item.commentCount}</Text>
          </View>
        </TouchableOpacity>
      )}
      refreshing={loading}
      onRefresh={fetchPosts}
    />
  );
};

export default PostList;

const styles = StyleSheet.create({
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  thumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  content: {
    fontSize: 14,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#888',
  },
  commentCount: {
    fontSize: 12,
    color: '#555',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  noImagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  noImageText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});