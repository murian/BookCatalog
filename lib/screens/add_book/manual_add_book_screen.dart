import 'package:flutter/material.dart';
import 'book_form_screen.dart';

class ManualAddBookScreen extends StatelessWidget {
  const ManualAddBookScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Navigate directly to the book form with empty data
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => const BookFormScreen(bookData: null),
        ),
      );
    });

    return const Scaffold(
      body: Center(
        child: CircularProgressIndicator(),
      ),
    );
  }
}
