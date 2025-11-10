import 'package:hive/hive.dart';
import 'package:crypto/crypto.dart';
import 'dart:convert';
import '../models/user_model.dart';

class LocalAuthService {
  static const String _usersBoxName = 'users';
  static const String _currentUserKey = 'current_user_id';

  // Hash password
  String _hashPassword(String password) {
    final bytes = utf8.encode(password);
    final hash = sha256.convert(bytes);
    return hash.toString();
  }

  // Sign up with email and password
  Future<UserModel?> signUpWithEmailPassword({
    required String email,
    required String password,
    String? displayName,
  }) async {
    try {
      final box = await Hive.openBox(_usersBoxName);

      // Check if user already exists
      final existingUser = box.values.firstWhere(
        (user) => user['email'] == email,
        orElse: () => null,
      );

      if (existingUser != null) {
        throw 'An account already exists for that email.';
      }

      // Create new user
      final uid = DateTime.now().millisecondsSinceEpoch.toString();
      final hashedPassword = _hashPassword(password);

      final userModel = UserModel(
        uid: uid,
        email: email,
        displayName: displayName,
      );

      // Store user with hashed password
      await box.put(uid, {
        ...userModel.toMap(),
        'password': hashedPassword,
      });

      // Set as current user
      final prefsBox = await Hive.openBox('preferences');
      await prefsBox.put(_currentUserKey, uid);

      return userModel;
    } catch (e) {
      if (e is String) rethrow;
      throw 'An unexpected error occurred. Please try again.';
    }
  }

  // Sign in with email and password
  Future<UserModel?> signInWithEmailPassword({
    required String email,
    required String password,
  }) async {
    try {
      final box = await Hive.openBox(_usersBoxName);
      final hashedPassword = _hashPassword(password);

      // Find user by email and password
      final userEntry = box.toMap().entries.firstWhere(
        (entry) =>
            entry.value['email'] == email &&
            entry.value['password'] == hashedPassword,
        orElse: () => throw 'Invalid email or password.',
      );

      final userData = Map<String, dynamic>.from(userEntry.value as Map);
      final userModel = UserModel.fromMap(userData);

      // Set as current user
      final prefsBox = await Hive.openBox('preferences');
      await prefsBox.put(_currentUserKey, userModel.uid);

      return userModel;
    } catch (e) {
      if (e is String) rethrow;
      throw 'Invalid email or password.';
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      final prefsBox = await Hive.openBox('preferences');
      await prefsBox.delete(_currentUserKey);
    } catch (e) {
      throw 'Failed to sign out. Please try again.';
    }
  }

  // Get current user
  Future<UserModel?> getCurrentUser() async {
    try {
      final prefsBox = await Hive.openBox('preferences');
      final userId = prefsBox.get(_currentUserKey);

      if (userId == null) return null;

      final box = await Hive.openBox(_usersBoxName);
      final userData = box.get(userId);

      if (userData == null) return null;

      return UserModel.fromMap(Map<String, dynamic>.from(userData as Map));
    } catch (e) {
      return null;
    }
  }

  // Check if user is signed in
  Future<bool> isSignedIn() async {
    final user = await getCurrentUser();
    return user != null;
  }

  // Reset password (simplified - in real app, would need email verification)
  Future<void> resetPassword(String email) async {
    try {
      final box = await Hive.openBox(_usersBoxName);

      // Check if user exists
      final userExists = box.values.any((user) => user['email'] == email);

      if (!userExists) {
        throw 'No user found for that email.';
      }

      // In a real app, you would send a reset email
      // For now, we just confirm the user exists
      throw 'Password reset email sent (demo mode - feature not implemented).';
    } catch (e) {
      if (e is String) rethrow;
      throw 'Failed to send reset email. Please try again.';
    }
  }

  // Get user profile
  Future<UserModel?> getUserProfile(String uid) async {
    try {
      final box = await Hive.openBox(_usersBoxName);
      final userData = box.get(uid);

      if (userData == null) return null;

      return UserModel.fromMap(Map<String, dynamic>.from(userData as Map));
    } catch (e) {
      throw 'Failed to get user profile.';
    }
  }

  // Update user profile
  Future<void> updateUserProfile({
    required String uid,
    String? displayName,
    String? photoUrl,
  }) async {
    try {
      final box = await Hive.openBox(_usersBoxName);
      final userData = box.get(uid);

      if (userData == null) {
        throw 'User not found.';
      }

      final updatedData = Map<String, dynamic>.from(userData as Map);
      if (displayName != null) updatedData['displayName'] = displayName;
      if (photoUrl != null) updatedData['photoUrl'] = photoUrl;

      await box.put(uid, updatedData);
    } catch (e) {
      throw 'Failed to update profile.';
    }
  }

  // Delete account
  Future<void> deleteAccount(String uid) async {
    try {
      final box = await Hive.openBox(_usersBoxName);
      await box.delete(uid);

      // Sign out if this was the current user
      final prefsBox = await Hive.openBox('preferences');
      final currentUserId = prefsBox.get(_currentUserKey);
      if (currentUserId == uid) {
        await signOut();
      }
    } catch (e) {
      throw 'Failed to delete account.';
    }
  }
}
