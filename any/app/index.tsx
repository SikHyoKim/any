import PostList from '@/components/PostList';
import { router } from 'expo-router';
import { Alert, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/authContext';

export default function Index() {
  const { user } = useAuth();

  const handleWritePress = () => {
    if (user) {
      router.push('/write');
    } else {
      Alert.alert('알림', '게시글 작성은 로그인 후 이용 가능합니다.');
      router.push('/login');
    }
  };

  const handleEditPress = () => {
    if (user) {
      router.push('/my-posts?mode=edit');
    } else {
      Alert.alert('알림', '게시글 수정은 로그인 후 이용 가능합니다.');
      router.push('/login');
    }
  };

  const handleDeletePress = () => {
    if (user) {
      router.push('/my-posts?mode=delete');
    } else {
      Alert.alert('알림', '게시글 삭제는 로그인 후 이용 가능합니다.');
      router.push('/login');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <PostList />
        <View style={styles.buttonContainer}>
          <View style={styles.topButtonRow}>
            {user && (
              <>
                <TouchableOpacity
                  style={[styles.smallButton, styles.editButton]}
                  onPress={handleEditPress}
                >
                  <Text style={styles.smallButtonText}>수정</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.smallButton, styles.deleteButton]}
                  onPress={handleDeletePress}
                >
                  <Text style={styles.smallButtonText}>삭제</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleWritePress}
          >
            <Text style={styles.buttonText}>게시글 작성</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    padding: 10,
    paddingBottom: 120, // 버튼들이 늘어났으므로 공간 확보
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingTop: 10,
  },
  topButtonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  smallButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  smallButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  button: {
    padding: 10,
    backgroundColor: 'green',
    borderRadius: 10,
    alignItems: 'center',
    margin: 10,
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});