import { FontAwesome } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { addDoc, collection, doc, getDoc, getDocs, increment, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../contexts/authContext';
import { db } from '../../scripts/firebaseConfig';

interface Post {
  id: string;
  authorName: string;
  content: string;
  images: string[];
  createdAt: any;
  commentCount: number;
  authorUid: string;
}

interface Comment {
  id: string;
  postId: string;
  authorUid: string;
  authorName: string;
  content: string;
  createdAt: any;
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const screenWidth = Dimensions.get('window').width;

  // 게시글 상세 정보 불러오기
  const fetchPost = async () => {
    if (!id || typeof id !== 'string') {
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'posts', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const postData = {
          id: docSnap.id,
          ...docSnap.data()
        } as Post;
        setPost(postData);
        
        // 댓글 불러오기
        await fetchComments(id);
      } else {
        console.log('게시글을 찾을 수 없습니다.');
        setPost(null);
      }
    } catch (error) {
      console.error('게시글 불러오기 오류:', error);
      setPost(null);
    } finally {
      setLoading(false);
    }
  };

  // 댓글 목록 불러오기
  const fetchComments = async (postId: string) => {
    setLoadingComments(true);
    try {
      const q = query(
        collection(db, 'comments'),
        orderBy('createdAt', 'asc') // 댓글은 오래된 순으로
      );
      
      const querySnapshot = await getDocs(q);
      const commentsData: Comment[] = [];
      
      querySnapshot.forEach((doc) => {
        const commentData = doc.data();
        // 해당 게시글의 댓글만 필터링
        if (commentData.postId === postId) {
          commentsData.push({
            id: doc.id,
            ...commentData
          } as Comment);
        }
      });
      
      setComments(commentsData);
    } catch (error) {
      console.error('댓글 불러오기 오류:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  // 댓글 작성
  const submitComment = async () => {
    if (!commentText.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (!user) {
      Alert.alert('알림', '댓글 작성은 로그인 후 이용 가능합니다.');
      return;
    }

    if (!post) {
      Alert.alert('오류', '게시글 정보를 찾을 수 없습니다.');
      return;
    }

    setSubmittingComment(true);
    try {
      // 댓글 추가
      const commentData = {
        postId: post.id,
        authorUid: user.uid,
        authorName: user.displayName || user.email || '익명',
        content: commentText.trim(),
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'comments'), commentData);

      // 게시글의 댓글 수 증가
      await updateDoc(doc(db, 'posts', post.id), {
        commentCount: increment(1)
      });

      // 상태 업데이트
      setCommentText('');
      setPost({ ...post, commentCount: post.commentCount + 1 });
      
      // 댓글 목록 새로고침
      await fetchComments(post.id);

      Alert.alert('댓글 작성 완료', '댓글이 등록되었습니다.');
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    } finally {
      setSubmittingComment(false);
    }
  };

  useEffect(() => {
    fetchPost();
  }, [id]);

  // 날짜 포맷 함수
  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  // 댓글 날짜 포맷 (간단하게)
  const formatCommentDate = (timestamp: any) => {
    if (!timestamp) return '';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMinutes < 1) return '방금 전';
      if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
      if (diffInHours < 24) return `${diffInHours}시간 전`;
      if (diffInDays < 7) return `${diffInDays}일 전`;
      
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return '';
    }
  };

  // 이미지 URI 유효성 검사
  const isValidImageUri = (uri: string | undefined | null): boolean => {
    if (!uri || typeof uri !== 'string') return false;
    const trimmedUri = uri.trim();
    if (trimmedUri === '') return false;
    
    return trimmedUri.startsWith('http://') || 
           trimmedUri.startsWith('https://') || 
           trimmedUri.startsWith('file://') ||
           trimmedUri.startsWith('content://');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>게시글을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContent}>
        {/* 1. 유저 이름 */}
        <Text style={styles.username}>{post.authorName}</Text>

        {/* 2. 게시글 이미지들 */}
        {post.images && post.images.length > 0 && (
          <ScrollView 
            horizontal 
            pagingEnabled 
            showsHorizontalScrollIndicator={false}
            style={styles.imageScrollView}
          >
            {post.images.map((imageUri, index) => (
              isValidImageUri(imageUri) && (
                <Image
                  key={index}
                  source={{ uri: imageUri }}
                  style={[styles.image, { width: screenWidth, height: screenWidth * 0.75 }]}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log('이미지 로드 실패:', error.nativeEvent.error);
                  }}
                />
              )
            ))}
          </ScrollView>
        )}

        {/* 이미지가 없을 때 플레이스홀더 */}
        {(!post.images || post.images.length === 0 || !post.images.some(uri => isValidImageUri(uri))) && (
          <View style={[styles.noImagePlaceholder, { width: screenWidth, height: screenWidth * 0.75 }]}>
            <Text style={styles.noImageText}>📷</Text>
            <Text style={styles.noImageText}>이미지 없음</Text>
          </View>
        )}

        {/* 3. 날짜와 댓글 수 */}
        <View style={styles.infoRow}>
          <Text style={styles.dateText}>{formatDate(post.createdAt)}</Text>
          <View style={styles.commentRow}>
            <FontAwesome name="comment-o" size={22} color="#555" />
            <Text style={styles.commentCount}>{post.commentCount}</Text>
          </View>
        </View>

        {/* 4. 게시글 내용 */}
        <Text style={styles.contentText}>{post.content}</Text>

        {/* 5. 댓글 목록 */}
        <View style={styles.commentsBox}>
          <Text style={styles.commentsTitle}>댓글 {comments.length}개</Text>
          {loadingComments ? (
            <View style={styles.commentLoadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.commentLoadingText}>댓글을 불러오는 중...</Text>
            </View>
          ) : comments.length > 0 ? (
            comments.map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUsername}>{comment.authorName}</Text>
                  <Text style={styles.commentDate}>{formatCommentDate(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noCommentsText}>아직 댓글이 없습니다.</Text>
          )}
        </View>
      </ScrollView>

      {/* 6. 댓글 작성 영역 */}
      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.commentInput}
          placeholder={user ? "댓글을 입력하세요..." : "로그인 후 댓글을 작성할 수 있습니다"}
          value={commentText}
          onChangeText={setCommentText}
          multiline
          maxLength={500}
          editable={!!user && !submittingComment}
        />
        <TouchableOpacity
          style={[
            styles.commentSubmitButton,
            (!user || !commentText.trim() || submittingComment) && styles.commentSubmitButtonDisabled
          ]}
          onPress={submitComment}
          disabled={!user || !commentText.trim() || submittingComment}
        >
          {submittingComment ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <FontAwesome name="send" size={16} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    margin: 16,
    marginBottom: 8,
  },
  imageScrollView: {
    marginBottom: 8,
  },
  image: {
    backgroundColor: '#eee',
  },
  noImagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  noImageText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 13,
    color: '#888',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    marginLeft: 6,
    fontSize: 15,
    color: '#555',
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  commentsBox: {
    marginHorizontal: 16,
    marginBottom: 80, // 댓글 입력창 공간 확보
  },
  commentsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  commentLoadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  commentLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  commentItem: {
    marginBottom: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  commentUsername: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#007AFF',
  },
  commentDate: {
    fontSize: 12,
    color: '#888',
  },
  commentContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  noCommentsText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
  },
  commentInputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 80,
    fontSize: 14,
    backgroundColor: '#f8f8f8',
  },
  commentSubmitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commentSubmitButtonDisabled: {
    backgroundColor: '#ccc',
  },
});