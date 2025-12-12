import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/books_provider.dart';
import 'screens/auth/login_screen.dart';
import 'screens/home/home_screen.dart';
import 'core/theme/app_theme.dart';
import 'models/book.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  print('🚀 Starting app initialization...');

  // Initialize Firebase with timeout to prevent hanging
  try {
    print('📱 Initializing Firebase...');
    await Firebase.initializeApp(
      options: const FirebaseOptions(
        apiKey: "AIzaSyBKQHO_FgzReL6UTIJbkZv-muJmJFs02BU",
        authDomain: "books-4012e.firebaseapp.com",
        projectId: "books-4012e",
        storageBucket: "books-4012e.firebasestorage.app",
        messagingSenderId: "777861825903",
        appId: "1:777861825903:web:05a0cffc86cb7c4e5fd49a",
      ),
    ).timeout(
      const Duration(seconds: 10),
      onTimeout: () {
        print('⚠️ Firebase initialization timed out after 10 seconds');
        throw TimeoutException('Firebase initialization timed out');
      },
    );
    print('✅ Firebase initialized successfully');
  } catch (e) {
    print('❌ Firebase initialization failed: $e');
    print('⚠️  App will continue with limited functionality');
  }

  // Initialize Hive (kept for local caching/preferences)
  print('💾 Initializing Hive...');
  await Hive.initFlutter();

  // Register Hive adapters
  Hive.registerAdapter(BookAdapter());
  print('✅ Hive initialized successfully');

  print('🎬 Launching app...');
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BooksProvider()),
      ],
      child: MaterialApp(
        title: 'Book Catalog',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatelessWidget {
  const AuthWrapper({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);

    // Show loading screen while checking authentication
    if (authProvider.isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('Loading...', style: TextStyle(fontSize: 16)),
            ],
          ),
        ),
      );
    }

    // Show appropriate screen based on auth state
    if (authProvider.isAuthenticated) {
      return const HomeScreen();
    } else {
      return const LoginScreen();
    }
  }
}
