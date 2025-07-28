import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import { Button, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { auth } from '../scripts/firebaseConfig';

export default function SignUpScreen() {
  
const [email, setEmail] = useState('');
const [pw, setPw] = useState('');
const [error, setError] = useState('');
const getKoreanErrorMessage = (error: any) => {
  switch (error.code) {
    case 'auth/invalid-email':
      return '이메일 형식이 올바르지 않습니다.';
    case 'auth/missing-password':
      return '비밀번호를 입력해주세요.';
    case 'auth/user-not-found':
      return '존재하지 않는 계정입니다.';
    case 'auth/wrong-password':
      return '비밀번호가 올바르지 않습니다.';
    case 'auth/email-already-in-use':
      return '이미 사용 중인 이메일입니다.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상이어야 합니다.';
    default:
      return '알 수 없는 오류가 발생했습니다.';
  }
}
const handleSignUp = async () => {
try {
await createUserWithEmailAndPassword(auth, email, pw);
router.replace('/login'); // 회원가입 성공 시 로그인 화면으로 이동
} catch (e) {
setError(getKoreanErrorMessage(e));
}
};
const goToLogin = () => {
router.replace('/login');
};
return (
  <View style={styles.container}>
    <Text style={styles.title}>회원가입</Text>
    <TextInput
      style={styles.input}
      placeholder="이메일"
      value={email}
      onChangeText={setEmail}
      autoCapitalize="none"
      keyboardType="email-address"
      />
    <TextInput
      style={styles.input}
      placeholder="비밀번호"
      value={pw}
      onChangeText={setPw}
      secureTextEntry
      />
    {error ? <Text style={styles.error}>{error}</Text> : null}
    <Button title="회원가입" onPress={handleSignUp} />
    <TouchableOpacity onPress={goToLogin} style={styles.loginButton}>
      <Text style={styles.loginText}>이미 계정이 있으신가요? 로그인</Text>
    </TouchableOpacity>
  </View>
);
}
const styles = StyleSheet.create({
container: {
flex: 1,
justifyContent: 'center',
alignItems: 'center',
padding: 24,
backgroundColor: '#fff',
},
title: {
fontSize: 28,
fontWeight: 'bold',
marginBottom: 32,
},
input: {
width: '100%',
maxWidth: 320,
height: 48,
borderColor: '#ccc',
borderWidth: 1,
borderRadius: 8,
paddingHorizontal: 16,
marginBottom: 16,
backgroundColor: '#fafafa',
fontSize: 16,
},
error: {
color: 'red',
marginBottom: 12,
},
loginButton: {
marginTop: 24,
padding: 8,
},
loginText: {
color: '#007AFF',
fontSize: 16,
fontWeight: 'bold',
},
});