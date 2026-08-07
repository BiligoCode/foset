import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PALETTE, findColor } from '../constants/palette';
import {
  CATEGORIES,
  SUBCATEGORIES,
  buildTitle,
  hasSubcategories,
  type Category,
} from '../constants/taxonomy';
import type { ClothingInput, ClothingItem } from '../db/types';
import {
  capturePhoto,
  deleteImage,
  imageUri,
  pickPhoto,
  processAndStorePhoto,
  type PickedPhoto,
} from '../imaging/photos';
import { colors, radius, spacing, typography } from '../theme';
import { Button } from './Button';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

type Props = {
  item?: ClothingItem;
  submitLabel: string;
  onSubmit: (input: ClothingInput) => Promise<void>;
};

type Errors = Partial<Record<'image' | 'category' | 'subcategory' | 'brand' | 'color', string>>;

export function ClothingForm({ item, submitLabel, onSubmit }: Props) {
  const [imagePath, setImagePath] = useState<string | null>(item?.image_path ?? null);
  const [category, setCategory] = useState<Category | null>(item?.category ?? null);
  const [subcategory, setSubcategory] = useState<string | null>(item?.subcategory ?? null);
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [colorName, setColorName] = useState<string | null>(item?.color_name ?? null);
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [processing, setProcessing] = useState(false);
  const [rawPhoto, setRawPhoto] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [saving, setSaving] = useState(false);

  // Photos are written to disk as soon as they are processed, before the item
  // exists. Whatever the item does not end up using is removed when the form
  // closes, which covers both cancelling and retaking a photo.
  const disposable = useRef(new Set<string>());
  const keep = useRef<string | null>(null);

  useEffect(
    () => () => {
      for (const fileName of disposable.current) {
        if (fileName !== keep.current) deleteImage(fileName);
      }
    },
    []
  );

  const takePhoto = async (source: () => Promise<PickedPhoto | null>) => {
    try {
      const picked = await source();
      if (!picked) return;

      setProcessing(true);
      const { fileName, backgroundRemoved, method } = await processAndStorePhoto(picked);
      disposable.current.add(fileName);
      setImagePath(fileName);
      setRawPhoto(!backgroundRemoved);
      setUsedFallback(method === 'javascript');
      setErrors((current) => ({ ...current, image: undefined }));
    } catch (error) {
      Alert.alert('Could not use that photo', messageOf(error));
    } finally {
      setProcessing(false);
    }
  };

  const changeCategory = (next: string | null) => {
    const value = next as Category | null;
    setCategory(value);
    // Subcategories are per category, and one-piece items have none at all.
    setSubcategory(null);
    setErrors((current) => ({ ...current, category: undefined, subcategory: undefined }));
  };

  const submit = async () => {
    const found: Errors = {};
    if (!imagePath) found.image = 'Add a photo of the item.';
    if (!category) found.category = 'Choose a category.';
    else if (hasSubcategories(category) && !subcategory) found.subcategory = 'Choose a type.';
    if (!brand.trim()) found.brand = 'Brand is required.';
    if (!colorName) found.color = 'Choose a colour.';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const color = findColor(colorName!);
    setSaving(true);
    try {
      await onSubmit({
        category: category!,
        subcategory: hasSubcategories(category!) ? subcategory : null,
        brand: brand.trim(),
        color_name: color!.name,
        color_hex: color!.hex,
        notes: notes.trim() ? notes.trim() : null,
        image_path: imagePath!,
      });

      keep.current = imagePath;
      // A replaced photo is only orphaned once the new one is committed.
      if (item && item.image_path !== imagePath) deleteImage(item.image_path);
    } catch (error) {
      setSaving(false);
      Alert.alert('Could not save', messageOf(error));
    }
  };

  const preview =
    category && colorName ? buildTitle(category, subcategory, colorName) : 'Pick a type and colour';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">
      <View style={styles.photo}>
        {imagePath ? (
          <Image
            source={{ uri: imageUri(imagePath) }}
            style={styles.photoImage}
            contentFit="contain"
            transition={150}
          />
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.photoHint}>No photo yet</Text>
          </View>
        )}

        {processing ? (
          <View style={styles.processing}>
            <ActivityIndicator color={colors.text} />
            <Text style={styles.processingLabel}>Making a studio shot…</Text>
          </View>
        ) : null}
      </View>

      {errors.image ? <Text style={styles.error}>{errors.image}</Text> : null}
      {rawPhoto ? (
        <Text style={styles.notice}>
          The background could not be removed cleanly, so the photo was only cropped. A plain,
          contrasting surface works best.
        </Text>
      ) : null}
      {!rawPhoto && usedFallback ? (
        <Text style={styles.notice}>
          Used the simpler on-device cutout. For the ML model, install a development build of Foset
          instead of Expo Go.
        </Text>
      ) : null}

      <View style={styles.photoActions}>
        <Button
          label="Take photo"
          variant="secondary"
          onPress={() => takePhoto(capturePhoto)}
          disabled={processing}
          style={styles.photoButton}
        />
        <Button
          label="Choose photo"
          variant="secondary"
          onPress={() => takePhoto(pickPhoto)}
          disabled={processing}
          style={styles.photoButton}
        />
      </View>

      <View style={styles.fields}>
        <SelectField
          label="Category"
          placeholder="Choose a category"
          value={category}
          options={CATEGORIES.map((value) => ({ value, label: value }))}
          onChange={changeCategory}
          error={errors.category}
        />

        {category && hasSubcategories(category) ? (
          <SelectField
            label="Type"
            placeholder="Choose a type"
            value={subcategory}
            options={SUBCATEGORIES[category].map((value) => ({ value, label: value }))}
            onChange={setSubcategory}
            error={errors.subcategory}
          />
        ) : null}

        <TextField
          label="Brand"
          placeholder="Uniqlo, Levi's, …"
          value={brand}
          onChangeText={setBrand}
          autoCapitalize="words"
          error={errors.brand}
        />

        <SelectField
          label="Colour"
          placeholder="Choose a colour"
          value={colorName}
          swatch={colorName ? findColor(colorName)?.hex : null}
          options={PALETTE.map((color) => ({
            value: color.name,
            label: color.name,
            swatch: color.hex,
          }))}
          onChange={setColorName}
          error={errors.color}
        />

        <TextField
          label="Notes"
          placeholder="Optional"
          value={notes}
          onChangeText={setNotes}
          multiline
        />

        <View style={styles.titlePreview}>
          <Text style={styles.titleLabel}>Title</Text>
          <Text style={styles.titleValue}>{preview}</Text>
          <Text style={styles.titleHint}>Built from the type and colour you pick.</Text>
        </View>
      </View>

      <Button label={submitLabel} onPress={submit} busy={saving} disabled={processing} />
    </ScrollView>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  photo: {
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
  },
  photoPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoHint: {
    ...typography.body,
    color: colors.muted,
  },
  processing: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  processingLabel: {
    ...typography.body,
    color: colors.text,
  },
  photoActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoButton: {
    flex: 1,
  },
  fields: {
    gap: spacing.lg,
  },
  titlePreview: {
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  titleLabel: {
    ...typography.label,
    color: colors.muted,
  },
  titleValue: {
    ...typography.heading,
    color: colors.text,
    marginTop: spacing.xs,
  },
  titleHint: {
    ...typography.caption,
    color: colors.muted,
    marginTop: spacing.xs,
  },
  error: {
    ...typography.caption,
    color: colors.danger,
  },
  notice: {
    ...typography.caption,
    color: colors.muted,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
