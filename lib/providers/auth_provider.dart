import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import '../services/firebase_auth_service.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuthService _authService = FirebaseAuthService();
  UserModel? _user;
  bool _isLoading = true; // Start with loading = true
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  AuthProvider() {
    print('🔐 AuthProvider initializing...');
    _checkCurrentUser();
  }

  // Check if user is already signed in
  Future<void> _checkCurrentUser() async {
    try {
      print('👤 Checking current user...');
      _user = await _authService.getCurrentUser().timeout(
        const Duration(seconds: 5),
        onTimeout: () {
          print('⚠️ getCurrentUser timed out, assuming no user');
          return null;
        },
      );
      print(_user != null ? '✅ User found: ${_user!.email}' : 'ℹ️ No user signed in');
    } catch (e) {
      print('❌ Error checking current user: $e');
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
      print('✅ AuthProvider initialization complete');
    }
  }

  // Sign up with email and password
  Future<bool> signUp({
    required String email,
    required String password,
    String? displayName,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final userModel = await _authService.signUpWithEmailPassword(
        email: email,
        password: password,
        displayName: displayName,
      );

      _user = userModel;
      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Sign in with email and password
  Future<bool> signIn({
    required String email,
    required String password,
  }) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      final userModel = await _authService.signInWithEmailPassword(
        email: email,
        password: password,
      );

      _user = userModel;
      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _authService.signOut();
      _user = null;
      notifyListeners();
    } catch (e) {
      _errorMessage = e.toString();
      notifyListeners();
    }
  }

  // Reset password
  Future<bool> resetPassword(String email) async {
    try {
      _isLoading = true;
      _errorMessage = null;
      notifyListeners();

      await _authService.resetPassword(email);

      _isLoading = false;
      notifyListeners();

      return true;
    } catch (e) {
      _errorMessage = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Clear error message
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
