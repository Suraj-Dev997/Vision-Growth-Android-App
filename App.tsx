import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ForceUpdateGate } from './src/components/ForceUpdateGate';
import { AuthProvider } from './src/context/AuthContext';
import RootNavigator from './src/navigation/RootNavigator';

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <ForceUpdateGate>
            <StatusBar barStyle="light-content" backgroundColor="#1E3A8A" translucent />
            <RootNavigator />
          </ForceUpdateGate>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default App;
