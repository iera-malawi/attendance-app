import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../theme';
import PrimaryButton from './PrimaryButton';

const MAX_NOTE = 255;

interface Props {
  visible: boolean;
  title: string;
  confirmLabel: string;
  onSubmit: (note: string) => void;
  onCancel: () => void;
}

/** Asks for the required field note before the location is taken. */
export default function FieldNoteModal({ visible, title, confirmLabel, onSubmit, onCancel }: Props) {
  const [note, setNote] = useState('');
  const trimmed = note.trim();

  const close = () => {
    setNote('');
    onCancel();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close" />
        <View style={styles.sheet} accessibilityViewIsModal>
          <Text style={styles.title} accessibilityRole="header">
            {title}
          </Text>
          <Text style={styles.label}>Note</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Where are you going?"
            placeholderTextColor={colors.muted}
            maxLength={MAX_NOTE}
            multiline
            autoFocus
            style={styles.input}
          />
          <Text style={styles.hint}>Your location is recorded when you continue.</Text>
          <View style={styles.buttons}>
            <PrimaryButton
              title={confirmLabel}
              disabled={!trimmed}
              onPress={() => {
                setNote('');
                onSubmit(trimmed);
              }}
            />
            <PrimaryButton title="Cancel" variant="outline" onPress={close} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', padding: 20, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.card, borderRadius: 16, padding: 20 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  label: { fontSize: 14, fontWeight: '600', color: colors.text, marginTop: 16, marginBottom: 6 },
  input: {
    minHeight: 88,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  hint: { fontSize: 13, color: colors.muted, marginTop: 6 },
  buttons: { gap: 10, marginTop: 20 },
});
