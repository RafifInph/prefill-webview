import { Stack } from "expo-router";

export default function StackLayout() {
    return (
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}>
        {/* Optionally configure static options outside the route.*/}
        <Stack.Screen name="home" options={{title: 'Home'}} />
        <Stack.Screen name="second" options={{title: 'Second'}} />
      </Stack>
    );
  }