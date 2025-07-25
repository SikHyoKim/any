import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, TouchableOpacity } from 'react-native';

const PostList = () => {
  const router = useRouter();

  return (
    <FlatList
      data={dummyData}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.item}
          onPress={() => {
            router.push(`/post-list-detail/${item.id}`);
          }}
        >
          <Text>{item.username}</Text>
          <Text>{item.content}</Text>
        </TouchableOpacity>
      )}
    />
  );
};

const dummyData = [
  {
    id: 1,
    username: 'John Doe',
    title: 'Hello World',
    content: 'This is a dummy data',
  },
  {
    id: 2,
    username: 'Jane Doe',
    title: 'Hello ',
    content: 'This is a dummy data',
  },
  
];

export default PostList;

const styles = StyleSheet.create({
  item: {
    padding: 16
  },
});