import PostList from '@/components/PostList';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <PostList />
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
    flex:1,
    padding: 10,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
  },
});