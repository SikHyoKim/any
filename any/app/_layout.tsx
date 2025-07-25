import { Stack } from 'expo-router';
import { Button } from 'react-native';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: '게시글 목록',
          headerRight: () => (
            // 여기에 로그인 버튼 또는 아이콘을 넣을 수 있습니다.
            <Button title="로그인" onPress={() => {/* 로그인 로직 */}} />
          ),
        }}
      />
      <Stack.Screen name="post-list-detail" options={{ headerShown: false }} />
    </Stack>
  );
}