import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, TextInput, SegmentedButtons, Card } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { AppHeader } from '../../src/components';
import { Colors } from '../../src/theme';
import { showAlert, confirmAlert } from '../../src/utils/alert';

const recordTypes = [
  { value: 'report', label: 'Report' },
  { value: 'lab_result', label: 'Lab' },
  { value: 'imaging', label: 'Imaging' },
];

export default function UploadReportsScreen() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('report');
  const [file, setFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        setFile(result.assets[0]);
      }
    } catch {
      showAlert('Error', 'Failed to pick document');
    }
  };

  const handleUpload = async () => {
    if (!title.trim()) {
      showAlert('Error', 'Please enter a title');
      return;
    }
    if (!file) {
      showAlert('Error', 'Please select a file');
      return;
    }
    setUploading(true);
    try {
      await new Promise((r) => setTimeout(r, 1500));
      showAlert('Success', 'Report uploaded successfully');
      router.back();
    } catch {
      showAlert('Error', 'Failed to upload. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AppHeader title="Upload Report" showBack />
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SegmentedButtons
          value={type}
          onValueChange={setType}
          buttons={recordTypes}
          style={styles.segmented}
        />

        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          mode="outlined"
          style={styles.input}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
        />

        <TextInput
          label="Description (Optional)"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          multiline
          numberOfLines={3}
          style={styles.input}
          outlineColor={Colors.border}
          activeOutlineColor={Colors.primary}
        />

        <TouchableOpacity onPress={handlePick} style={styles.uploadArea}>
          <MaterialCommunityIcons
            name={file ? 'file-check-outline' : 'cloud-upload-outline'}
            size={48}
            color={file ? Colors.success : Colors.primary}
          />
          <Text style={styles.uploadText}>
            {file ? file.name : 'Tap to select a file'}
          </Text>
          <Text style={styles.uploadHint}>PDF, JPG, or PNG (max 10MB)</Text>
        </TouchableOpacity>

        <Button
          mode="contained"
          onPress={handleUpload}
          loading={uploading}
          disabled={uploading}
          style={styles.submitBtn}
          contentStyle={styles.submitBtnContent}
          labelStyle={styles.submitBtnLabel}
        >
          {uploading ? 'Uploading...' : 'Upload Report'}
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 16, paddingBottom: 24 },
  segmented: { marginBottom: 20 },
  input: { marginBottom: 14, backgroundColor: Colors.white },
  uploadArea: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.white, borderRadius: 16,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    paddingVertical: 40, marginBottom: 24,
  },
  uploadText: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginTop: 12 },
  uploadHint: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  submitBtn: { borderRadius: 12 },
  submitBtnContent: { paddingVertical: 6 },
  submitBtnLabel: { fontSize: 16, fontWeight: '600' },
});
