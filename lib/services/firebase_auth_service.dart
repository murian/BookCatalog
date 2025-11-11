import 'package:firebase_auth/firebase_auth.dart';
import '../models/user_model.dart';

class FirebaseAuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;

  // Get current Firebase user
  User? get currentFirebaseUser => _auth.currentUser;

  // Stream of auth state changes
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Sign up with email and password
  Future<UserModel?> signUpWithEmailPassword({
    required String email,
    required String password,
    String? displayName,
  }) async {
    try {
      // Create user in Firebase Auth
      final UserCredential credential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );

      final User? firebaseUser = credential.user;
      if (firebaseUser == null) {
        throw 'Failed to create user account.';
      }

      // Update display name if provided
      if (displayName != null && displayName.isNotEmpty) {
        await firebaseUser.updateDisplayName(displayName);
        await firebaseUser.reload();
      }

      // Return UserModel
      return UserModel(
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? email,
        displayName: displayName ?? firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
      );
    } on FirebaseAuthException catch (e) {
      print('🔥 FirebaseAuthException (signup): ${e.code} - ${e.message}');
      switch (e.code) {
        case 'weak-password':
          throw 'The password provided is too weak.';
        case 'email-already-in-use':
          throw 'An account already exists for that email.';
        case 'invalid-email':
          throw 'The email address is invalid.';
        case 'app-not-authorized':
          throw 'Firebase not configured. Please check FIREBASE_SETUP.md';
        case 'api-key-not-valid':
          throw 'Invalid Firebase API key. Please configure Firebase in lib/main.dart';
        default:
          throw 'Registration error: ${e.message ?? e.code}';
      }
    } catch (e) {
      print('❌ Signup error: $e');
      if (e.toString().contains('MissingPluginException') ||
          e.toString().contains('PlatformException')) {
        throw 'Firebase not properly configured. Please see FIREBASE_SETUP.md for setup instructions.';
      }
      throw 'Registration failed: $e';
    }
  }

  // Sign in with email and password
  Future<UserModel?> signInWithEmailPassword({
    required String email,
    required String password,
  }) async {
    try {
      final UserCredential credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      final User? firebaseUser = credential.user;
      if (firebaseUser == null) {
        throw 'Failed to sign in.';
      }

      return UserModel(
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? email,
        displayName: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
      );
    } on FirebaseAuthException catch (e) {
      print('🔥 FirebaseAuthException: ${e.code} - ${e.message}');
      switch (e.code) {
        case 'user-not-found':
          throw 'No user found for that email.';
        case 'wrong-password':
          throw 'Wrong password provided.';
        case 'invalid-email':
          throw 'The email address is invalid.';
        case 'user-disabled':
          throw 'This account has been disabled.';
        case 'invalid-credential':
          throw 'Invalid email or password.';
        case 'app-not-authorized':
          throw 'Firebase not configured. Please check FIREBASE_SETUP.md';
        case 'api-key-not-valid':
          throw 'Invalid Firebase API key. Please configure Firebase in lib/main.dart';
        default:
          throw 'Authentication error: ${e.message ?? e.code}';
      }
    } catch (e) {
      print('❌ Login error: $e');
      if (e.toString().contains('MissingPluginException') ||
          e.toString().contains('PlatformException')) {
        throw 'Firebase not properly configured. Please see FIREBASE_SETUP.md for setup instructions.';
      }
      throw 'Login failed: $e';
    }
  }

  // Sign out
  Future<void> signOut() async {
    try {
      await _auth.signOut();
    } catch (e) {
      throw 'Failed to sign out: $e';
    }
  }

  // Get current user
  Future<UserModel?> getCurrentUser() async {
    try {
      final User? firebaseUser = _auth.currentUser;
      if (firebaseUser == null) return null;

      return UserModel(
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName,
        photoUrl: firebaseUser.photoURL,
      );
    } catch (e) {
      return null;
    }
  }

  // Check if user is signed in
  bool isSignedIn() {
    return _auth.currentUser != null;
  }

  // Reset password
  Future<void> resetPassword(String email) async {
    try {
      await _auth.sendPasswordResetEmail(email: email);
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'user-not-found':
          throw 'No user found for that email.';
        case 'invalid-email':
          throw 'The email address is invalid.';
        default:
          throw 'Failed to send reset email: ${e.message}';
      }
    } catch (e) {
      throw 'An unexpected error occurred: $e';
    }
  }

  // Update user profile
  Future<void> updateUserProfile({
    String? displayName,
    String? photoUrl,
  }) async {
    try {
      final User? firebaseUser = _auth.currentUser;
      if (firebaseUser == null) {
        throw 'No user signed in.';
      }

      if (displayName != null) {
        await firebaseUser.updateDisplayName(displayName);
      }

      if (photoUrl != null) {
        await firebaseUser.updatePhotoURL(photoUrl);
      }

      await firebaseUser.reload();
    } on FirebaseAuthException catch (e) {
      throw 'Failed to update profile: ${e.message}';
    } catch (e) {
      throw 'An unexpected error occurred: $e';
    }
  }

  // Delete account
  Future<void> deleteAccount() async {
    try {
      final User? firebaseUser = _auth.currentUser;
      if (firebaseUser == null) {
        throw 'No user signed in.';
      }

      await firebaseUser.delete();
    } on FirebaseAuthException catch (e) {
      if (e.code == 'requires-recent-login') {
        throw 'Please sign out and sign in again before deleting your account.';
      }
      throw 'Failed to delete account: ${e.message}';
    } catch (e) {
      throw 'An unexpected error occurred: $e';
    }
  }

  // Reauthenticate user (needed before sensitive operations like delete)
  Future<void> reauthenticate(String password) async {
    try {
      final User? firebaseUser = _auth.currentUser;
      if (firebaseUser == null || firebaseUser.email == null) {
        throw 'No user signed in.';
      }

      final credential = EmailAuthProvider.credential(
        email: firebaseUser.email!,
        password: password,
      );

      await firebaseUser.reauthenticateWithCredential(credential);
    } on FirebaseAuthException catch (e) {
      switch (e.code) {
        case 'wrong-password':
          throw 'Wrong password provided.';
        case 'user-mismatch':
          throw 'Credential does not match current user.';
        default:
          throw 'Failed to reauthenticate: ${e.message}';
      }
    } catch (e) {
      throw 'An unexpected error occurred: $e';
    }
  }
}
