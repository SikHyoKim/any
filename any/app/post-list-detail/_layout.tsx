import { Stack } from 'expo-router';

export default function PostListDetailLayout() {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ headerShown: true, title: '게시글 상세' }} />
    </Stack>
  );
}