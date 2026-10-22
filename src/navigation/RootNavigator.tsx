import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabIcon } from '../components/TabIcon';
import { withTabletShell } from '../components/TabletShell';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme/colors';

import SplashScreen from '../screens/auth/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import VerifyOtpScreen from '../screens/auth/VerifyOtpScreen';
import SuccessScreen from '../screens/auth/SuccessScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import ResetOtpScreen from '../screens/auth/ResetOtpScreen';
import ResetPasswordScreen from '../screens/auth/ResetPasswordScreen';

import HomeScreen from '../screens/main/HomeScreen';
import ChildrenScreen from '../screens/main/ChildrenScreen';
import VisitsScreen from '../screens/main/VisitsScreen';
import FollowUpsScreen from '../screens/main/FollowUpsScreen';
import FollowUpsAllScreen from '../screens/main/FollowUpsAllScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

import ChildDetailScreen from '../screens/child/ChildDetailScreen';
import AssessmentScreen from '../screens/child/AssessmentScreen';
import FollowUpScreen from '../screens/child/FollowUpScreen';
import VisitRecordScreen from '../screens/child/VisitRecordScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Phone layout unchanged; tablets get a centered content column. */
const Splash = withTabletShell(SplashScreen, '#262857');
const Login = withTabletShell(LoginScreen);
const Register = withTabletShell(RegisterScreen);
const VerifyOtp = withTabletShell(VerifyOtpScreen);
const Success = withTabletShell(SuccessScreen);
const ForgotPassword = withTabletShell(ForgotPasswordScreen);
const ResetOtp = withTabletShell(ResetOtpScreen);
const ResetPassword = withTabletShell(ResetPasswordScreen);

const Home = withTabletShell(HomeScreen);
const Children = withTabletShell(ChildrenScreen);
const Visits = withTabletShell(VisitsScreen);
const FollowUps = withTabletShell(FollowUpsScreen);
const Profile = withTabletShell(ProfileScreen);

const FollowUpsAll = withTabletShell(FollowUpsAllScreen);
const ChildDetail = withTabletShell(ChildDetailScreen);
const Assessment = withTabletShell(AssessmentScreen);
const FollowUp = withTabletShell(FollowUpScreen);
const VisitRecord = withTabletShell(VisitRecordScreen);

function MainTabs() {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 8);
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 56 + bottomPad,
          paddingBottom: bottomPad,
          paddingTop: 8,
          borderTopColor: colors.line,
          backgroundColor: colors.white,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}>
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Children"
        component={Children}
        options={{
          title: 'Children',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="children" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Visits"
        component={Visits}
        options={{
          title: 'Visits',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="visits" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="FollowUps"
        component={FollowUps}
        options={{
          title: 'Follow-ups',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="followups" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Splash" component={Splash} />
      <AuthStack.Screen name="Login" component={Login} />
      <AuthStack.Screen name="Register" component={Register} />
      <AuthStack.Screen name="VerifyOtp" component={VerifyOtp} />
      <AuthStack.Screen name="Success" component={Success} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPassword} />
      <AuthStack.Screen name="ResetOtp" component={ResetOtp} />
      <AuthStack.Screen name="ResetPassword" component={ResetPassword} />
    </AuthStack.Navigator>
  );
}

function AppNavigator() {
  return (
    <AppStack.Navigator>
      <AppStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <AppStack.Screen name="FollowUpsAll" component={FollowUpsAll} options={{ headerShown: false }} />
      <AppStack.Screen name="ChildDetail" component={ChildDetail} options={{ headerShown: false }} />
      <AppStack.Screen
        name="Assessment"
        component={Assessment}
        options={{ headerShown: false, unmountOnBlur: true }}
      />
      <AppStack.Screen
        name="FollowUp"
        component={FollowUp}
        options={{ headerShown: false, unmountOnBlur: true }}
      />
      <AppStack.Screen name="VisitRecord" component={VisitRecord} options={{ headerShown: false }} />
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, token } = useAuth();

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.navy} size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {token ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
