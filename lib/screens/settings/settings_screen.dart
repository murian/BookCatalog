import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:hive/hive.dart';
import '../../providers/books_provider.dart';
import '../../providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final _apiKeyController = TextEditingController();
  String _selectedModel = 'gemini-1.5-flash';
  bool _isLoading = true;
  bool _obscureApiKey = true;

  // Available Gemini models
  final List<Map<String, String>> _geminiModels = [
    {
      'id': 'gemini-1.5-flash',
      'name': 'Gemini 1.5 Flash',
      'description': 'Fast and efficient (Recommended)',
    },
    {
      'id': 'gemini-1.5-pro',
      'name': 'Gemini 1.5 Pro',
      'description': 'Most capable, slower',
    },
    {
      'id': 'gemini-pro',
      'name': 'Gemini Pro',
      'description': 'Balanced performance',
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    try {
      final prefsBox = await Hive.openBox('preferences');
      final savedApiKey = prefsBox.get('gemini_api_key', defaultValue: '');
      final savedModel = prefsBox.get('gemini_model', defaultValue: 'gemini-1.5-flash');

      setState(() {
        _apiKeyController.text = savedApiKey;
        _selectedModel = savedModel;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _saveSettings() async {
    try {
      final prefsBox = await Hive.openBox('preferences');
      await prefsBox.put('gemini_api_key', _apiKeyController.text.trim());
      await prefsBox.put('gemini_model', _selectedModel);

      // Re-initialize Gemini with new settings including model selection
      if (_apiKeyController.text.trim().isNotEmpty) {
        final booksProvider = Provider.of<BooksProvider>(context, listen: false);
        booksProvider.initializeGemini(
          _apiKeyController.text.trim(),
          model: _selectedModel,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Settings saved successfully! AI will use the selected model.'),
            backgroundColor: Colors.green,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save settings: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  void dispose() {
    _apiKeyController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final booksProvider = Provider.of<BooksProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: const Color(0xFF6200EE),
        foregroundColor: Colors.white,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                // Account Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Account',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 16),
                        ListTile(
                          leading: const Icon(Icons.person),
                          title: Text(authProvider.user?.displayName ?? 'No name'),
                          subtitle: const Text('Display Name'),
                          contentPadding: EdgeInsets.zero,
                        ),
                        ListTile(
                          leading: const Icon(Icons.email),
                          title: Text(authProvider.user?.email ?? 'No email'),
                          subtitle: const Text('Email'),
                          contentPadding: EdgeInsets.zero,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // AI Configuration Section
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.auto_awesome, color: Color(0xFF6200EE)),
                            const SizedBox(width: 8),
                            const Text(
                              'AI Configuration',
                              style: TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Configure Google Gemini for AI-powered book recognition',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 24),

                        // API Key Input
                        TextField(
                          controller: _apiKeyController,
                          obscureText: _obscureApiKey,
                          decoration: InputDecoration(
                            labelText: 'Gemini API Key',
                            hintText: 'AIza...',
                            border: const OutlineInputBorder(),
                            prefixIcon: const Icon(Icons.key),
                            suffixIcon: IconButton(
                              icon: Icon(
                                _obscureApiKey ? Icons.visibility : Icons.visibility_off,
                              ),
                              onPressed: () {
                                setState(() {
                                  _obscureApiKey = !_obscureApiKey;
                                });
                              },
                            ),
                            helperText: booksProvider.isGeminiInitialized
                                ? '✅ API key configured'
                                : 'Get your free API key from makersuite.google.com',
                          ),
                        ),
                        const SizedBox(height: 16),

                        // Model Selection
                        const Text(
                          'Select Gemini Model',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 12),

                        ..._geminiModels.map((model) {
                          return RadioListTile<String>(
                            value: model['id']!,
                            groupValue: _selectedModel,
                            onChanged: (value) {
                              setState(() {
                                _selectedModel = value!;
                              });
                            },
                            title: Text(model['name']!),
                            subtitle: Text(
                              model['description']!,
                              style: TextStyle(
                                fontSize: 12,
                                color: Colors.grey[600],
                              ),
                            ),
                            contentPadding: EdgeInsets.zero,
                          );
                        }).toList(),

                        const SizedBox(height: 16),

                        // Get API Key Link
                        InkWell(
                          onTap: () {
                            // Could open URL here if url_launcher is added
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text(
                                  'Visit: makersuite.google.com/app/apikey',
                                ),
                              ),
                            );
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.blue[50],
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.blue[200]!),
                            ),
                            child: Row(
                              children: [
                                Icon(Icons.info_outline, color: Colors.blue[700]),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Get your free API key',
                                        style: TextStyle(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.blue[900],
                                        ),
                                      ),
                                      Text(
                                        'makersuite.google.com/app/apikey',
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Colors.blue[700],
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Icon(Icons.open_in_new, color: Colors.blue[700], size: 20),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Save Button
                ElevatedButton(
                  onPressed: _saveSettings,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.all(16),
                    backgroundColor: const Color(0xFF6200EE),
                    foregroundColor: Colors.white,
                  ),
                  child: const Text(
                    'Save Settings',
                    style: TextStyle(fontSize: 16),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
    );
  }
}
