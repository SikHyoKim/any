import { router, Stack } from 'expo-router';
import { Button } from 'react-native';
import { AuthProvider, useAuth } from '../contexts/authContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: '게시글 목록',
            headerLeft: () => null,
            headerBackVisible: false,
            headerRight: () => <HeaderAuthButton />,
          }}
        />
        <Stack.Screen name="post-list-detail" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="write" options={{ headerShown: true }} />
        <Stack.Screen 
          name="my-posts" 
          options={{ headerShown: true, title: '내 게시글' }} 
        />
        <Stack.Screen 
          name="edit-post" 
          options={{ headerShown: true, title: '게시글 수정' }} 
        />
      </Stack>
    </AuthProvider>
  );
}

function HeaderAuthButton() {
  const { user, signOut } = useAuth();

  if (user) {
    return (
      <Button
        title="로그아웃"
        onPress={async () => {
          await signOut();
          router.replace('/');
        }}
      />
    );
  } else {
    return (
      <Button
        title="로그인"
        onPress={() => {
          router.push('/login');
        }}
      />
    );
  }
}