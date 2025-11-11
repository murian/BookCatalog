import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';

class BookCoverImage extends StatelessWidget {
  final String? imageUrl;
  final double width;
  final double height;
  final BoxFit fit;
  final BorderRadius? borderRadius;

  const BookCoverImage({
    Key? key,
    required this.imageUrl,
    this.width = 80,
    this.height = 120,
    this.fit = BoxFit.cover,
    this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(12);

    // Default placeholder
    final placeholder = Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Colors.grey.shade300,
            Colors.grey.shade200,
          ],
        ),
        borderRadius: radius,
      ),
      child: Icon(
        Icons.menu_book_rounded,
        size: width * 0.5,
        color: Colors.grey.shade400,
      ),
    );

    if (imageUrl == null || imageUrl!.isEmpty) {
      return ClipRRect(
        borderRadius: radius,
        child: placeholder,
      );
    }

    // Clean up the URL - ensure HTTPS
    String cleanUrl = imageUrl!;
    if (cleanUrl.startsWith('http://')) {
      cleanUrl = cleanUrl.replaceFirst('http://', 'https://');
    }

    // For web, use Image.network directly with better error handling
    if (kIsWeb) {
      return ClipRRect(
        borderRadius: radius,
        child: Image.network(
          cleanUrl,
          width: width,
          height: height,
          fit: fit,
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              width: width,
              height: height,
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: radius,
              ),
              child: Center(
                child: SizedBox(
                  width: 24,
                  height: 24,
                  child: CircularProgressIndicator(
                    value: loadingProgress.expectedTotalBytes != null
                        ? loadingProgress.cumulativeBytesLoaded /
                            loadingProgress.expectedTotalBytes!
                        : null,
                    strokeWidth: 2,
                  ),
                ),
              ),
            );
          },
          errorBuilder: (context, error, stackTrace) {
            // Try Open Library cover as fallback
            return placeholder;
          },
        ),
      );
    }

    // For mobile, use CachedNetworkImage
    return ClipRRect(
      borderRadius: radius,
      child: CachedNetworkImage(
        imageUrl: cleanUrl,
        width: width,
        height: height,
        fit: fit,
        placeholder: (context, url) => Container(
          width: width,
          height: height,
          decoration: BoxDecoration(
            color: Colors.grey.shade200,
            borderRadius: radius,
          ),
          child: const Center(
            child: SizedBox(
              width: 24,
              height: 24,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
        errorWidget: (context, url, error) => placeholder,
      ),
    );
  }
}
