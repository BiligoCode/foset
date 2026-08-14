import { useHeaderHeight } from '@react-navigation/elements';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';

import {
  PALETTE,
  decodeColorNames,
  encodeColorHexes,
  encodeColorNames,
  findColor,
} from '../constants/palette';
import {
  CATEGORIES,
  SUBCATEGORIES,
  buildTitle,
  hasSubcategories,
  type Category,
} from '../constants/taxonomy';
import type { ClothingInput, ClothingItem } from '../db/types';
import {
  PermissionDeniedError,
  capturePhoto,
  deleteImage,
  imageUri,
  pickPhoto,
  processAndStorePhoto,
  type PickedPhoto,
} from '../imaging/photos';
import { radius, spacing, typography, type ThemeColors } from '../theme';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { SelectField } from './SelectField';
import { TextField } from './TextField';

type Props = {
  item?: ClothingItem;
  submitLabel: string;
  onSubmit: (input: ClothingInput) => Promise<void>;
};

type Errors = Partial<
  Record<'image' | 'category' | 'subcategory' | 'color' | 'title', string>
>;

function suggestedTitle(
  category: Category | null,
  subcategory: string | null,
  colorNames: string[]
): string {
  if (!category || colorNames.length === 0) return '';
  return buildTitle(category, subcategory, colorNames[0]);
}

export function ClothingForm({ item, submitLabel, onSubmit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const headerHeight = useHeaderHeight();
  const initialColors = item ? decodeColorNames(item.color_name) : [];
  const initialSuggested = item
    ? suggestedTitle(item.category, item.subcategory, initialColors)
    : '';

  const [imagePath, setImagePath] = useState<string | null>(item?.image_path ?? null);
  const [category, setCategory] = useState<Category | null>(item?.category ?? null);
  const [subcategory, setSubcategory] = useState<string | null>(item?.subcategory ?? null);
  const [brand, setBrand] = useState(item?.brand ?? '');
  const [colorNames, setColorNames] = useState<string[]>(initialColors);
  const [title, setTitle] = useState(item?.title ?? '');
  const [titleTouched, setTitleTouched] = useState(
    item ? item.title !== initialSuggested : false
  );
  const [notes, setNotes] = useState(item?.notes ?? '');
  const [errors, setErrors] = useState<Errors>({});
  const [processing, setProcessing] = useState(false);
  const [rawPhoto, setRawPhoto] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [saving, setSaving] = useState(false);
  // Edge-to-edge Android no longer resizes the window for the keyboard, so the
  // form has to leave room and scroll the focused field into view itself.
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // Photos are written to disk as soon as they are processed, before the item
  // exists. Whatever the item does not end up using is removed when the form
  // closes, which covers both cancelling and retaking a photo.
  const disposable = useRef(new Set<string>());
  const keep = useRef<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const fieldsTop = useRef(0);
  const fieldLocalY = useRef<Record<string, number>>({});
  const focusedField = useRef<string | null>(null);

  const draftTitle = suggestedTitle(category, subcategory, colorNames);

  useEffect(() => {
    if (!titleTouched && draftTitle) setTitle(draftTitle);
  }, [draftTitle, titleTouched]);

  useEffect(
    () => () => {
      for (const fileName of disposable.current) {
        if (fileName !== keep.current) deleteImage(fileName);
      }
    },
    []
  );

  useEffect(() => {
    function scrollToField(key: string) {
      const local = fieldLocalY.current[key];
      if (local == null) return;
      scrollRef.current?.scrollTo({
        y: Math.max(0, fieldsTop.current + local - spacing.lg),
        animated: true,
      });
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const show = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      const key = focusedField.current;
      if (key) {
        // Padding updates on the next paint, then scroll the focused field up.
        requestAnimationFrame(() => scrollToField(key));
      }
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      focusedField.current = null;
    });
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const rememberField = (key: string) => (event: LayoutChangeEvent) => {
    fieldLocalY.current[key] = event.nativeEvent.layout.y;
  };

  const focusField = (key: string) => () => {
    focusedField.current = key;
    const local = fieldLocalY.current[key];
    if (local == null) return;
    // Keyboard height often arrives after focus. Retry shortly as a fallback.
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        y: Math.max(0, fieldsTop.current + local - spacing.lg),
        animated: true,
      });
    }, 100);
  };

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
      if (error instanceof PermissionDeniedError) {
        Alert.alert('Permission needed', error.message, [
          { text: 'Not now', style: 'cancel' },
          { text: 'Open Settings', onPress: () => void Linking.openSettings() },
        ]);
        return;
      }
      Alert.alert('Could not use that photo', messageOf(error));
    } finally {
      setProcessing(false);
    }
  };

  const changeCategory = (next: string | null) => {
    const value = next as Category | null;
    setCategory(value);
    // Types are per category, so a leftover type from the last category is wrong.
    setSubcategory(null);
    setErrors((current) => ({ ...current, category: undefined, subcategory: undefined }));
  };

  const changeTitle = (next: string) => {
    setTitle(next);
    setTitleTouched(true);
    setErrors((current) => ({ ...current, title: undefined }));
  };

  const submit = async () => {
    const found: Errors = {};
    if (!imagePath) found.image = 'Add a photo of the item.';
    if (!category) found.category = 'Choose a category.';
    else if (hasSubcategories(category) && !subcategory) found.subcategory = 'Choose a type.';
    if (colorNames.length === 0) found.color = 'Choose at least one colour.';
    if (!title.trim()) found.title = 'Title is required.';

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    const selectedColors = colorNames
      .map((name) => findColor(name))
      .filter((color): color is NonNullable<typeof color> => color != null);
    if (selectedColors.length !== colorNames.length) {
      found.color = 'Choose colours from the palette.';
      setErrors(found);
      return;
    }

    setSaving(true);
    // Mark the photo to keep before onSubmit navigates away. Otherwise the
    // unmount cleanup can delete the file while the DB row still points at it.
    keep.current = imagePath;
    disposable.current.delete(imagePath!);
    try {
      await onSubmit({
        title: title.trim(),
        category: category!,
        subcategory: hasSubcategories(category!) ? subcategory : null,
        brand: brand.trim(),
        color_name: encodeColorNames(colorNames),
        color_hex: encodeColorHexes(selectedColors.map((color) => color.hex)),
        notes: notes.trim() ? notes.trim() : null,
        image_path: imagePath!,
      });

      // A replaced photo is only orphaned once the new one is committed.
      if (item && item.image_path !== imagePath) deleteImage(item.image_path);
    } catch (error) {
      keep.current = null;
      if (imagePath) disposable.current.add(imagePath);
      setSaving(false);
      Alert.alert('Could not save', messageOf(error));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={headerHeight}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              spacing.xxl + (Platform.OS === 'android' ? keyboardHeight : 0),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag">
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
              <View style={styles.processingBackdrop} />
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
            Used the simpler on-device cutout. A plain, contrasting surface usually works better.
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

        <View
          style={styles.fields}
          onLayout={(event) => {
            fieldsTop.current = event.nativeEvent.layout.y;
          }}>
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

          <View onLayout={rememberField('brand')}>
            <TextField
              label="Brand"
              placeholder="Optional"
              value={brand}
              onChangeText={setBrand}
              autoCapitalize="words"
              onFocus={focusField('brand')}
            />
          </View>

          <SelectField
            label="Colour"
            placeholder="Choose colours"
            multiple
            value={colorNames}
            options={PALETTE.map((color) => ({
              value: color.name,
              label: color.name,
              swatch: color.hex,
            }))}
            onChange={setColorNames}
            error={errors.color}
          />

          <View onLayout={rememberField('title')}>
            <TextField
              label="Title"
              placeholder={draftTitle || 'Colour and type fill this in'}
              value={title}
              onChangeText={changeTitle}
              error={errors.title}
              onFocus={focusField('title')}
            />
          </View>

          <View onLayout={rememberField('notes')}>
            <TextField
              label="Notes"
              placeholder="Optional"
              value={notes}
              onChangeText={setNotes}
              multiline
              onFocus={focusField('notes')}
            />
          </View>
        </View>

        <Button label={submitLabel} onPress={submit} busy={saving} disabled={processing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
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
  },
  processingBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.surface,
    opacity: 0.85,
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
}
