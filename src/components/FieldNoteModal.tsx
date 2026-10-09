import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { getFieldCategories } from '../api/schedule';
import type { FieldCategory } from '../api/types';
import { colors } from '../theme';
import { getErrorMessage } from '../utils/errors';
import PrimaryButton from './PrimaryButton';

const MAX_NOTE = 255;

interface Props {
  visible: boolean;
  title: string;
  confirmLabel: string;
  onSubmit: (field: { category: string; note: string }) => void;
  onCancel: () => void;
}

/** Asks for the field reason (and a note when the reason needs one) before the location is taken. */
export default function FieldNoteModal({ visible, title, confirmLabel, onSubmit, onCancel }: Props) {
  const [categories, setCategories] = useState<FieldCategory[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [category, setCategory] = useState<FieldCategory | null>(null);
  const [note, setNote] = useState('');
  const trimmed = note.trim();
  const canSubmit = !!category && (!category.requires_note || !!trimmed);

  // Reload each time it opens so admin changes show up.
  useEffect(() => {
    if (!visible) return;
    getFieldCategories()
      .then((list) => {
        setCategories(list);
        setLoadError(null);
      })
      .catch((err) => setLoadError(getErrorMessage(err)));
  }, [visible]);

  const reset = () => {
    setNote('');
    setCategory(null);
  };

  const close = () => {
    reset();
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

          <Text style={styles.label}>Reason</Text>
          {!categories ? (
            loadError ? (
              <Text style={styles.error}>{loadError}</Text>
            ) : (
              <ActivityIndicator color={colors.primary} style={styles.loading} />
            )
          ) : (
            <View style={styles.chips}>
              {categories.map((c) => {
                const selected = category?.id === c.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => setCategory(c)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    style={[styles.chip, selected && styles.chipSelected]}
                  >
                    <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{c.name}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}

          <Text style={styles.label}>
            Note{' '}
            <Text style={category?.requires_note ? styles.required : styles.optional}>
              {category?.requires_note ? '(required)' : '(optional)'}
            </Text>
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Where are you going?"
            placeholderTextColor={colors.muted}
            maxLength={MAX_NOTE}
            multiline
            style={styles.input}
          />
          <Text style={styles.hint}>Your location is recorded when you continue.</Text>
          <View style={styles.buttons}>
            <PrimaryButton
              title={confirmLabel}
              disabled={!canSubmit}
              onPress={() => {
                if (!category) return;
                const field = { category: category.name, note: trimmed };
                reset();
                onSubmit(field);
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
  required: { color: colors.danger, fontWeight: '400' },
  optional: { color: colors.muted, fontWeight: '400' },
  loading: { alignSelf: 'flex-start' },
  error: { fontSize: 14, color: colors.danger },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  chipText: { fontSize: 14, fontWeight: '500', color: colors.text },
  chipTextSelected: { color: colors.primaryDark },
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
