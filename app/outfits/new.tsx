import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { OutfitForm } from '../../src/components/OutfitForm';
import { createOutfit } from '../../src/db/outfits';

export default function NewOutfitScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  // Set when arriving from a clothing item, so that item starts out selected.
  const { preselect } = useLocalSearchParams<{ preselect?: string }>();
  const selection = preselect ? [Number(preselect)] : [];

  return (
    <OutfitForm
      selection={selection}
      submitLabel="Create outfit"
      onSubmit={async (name, clothingIds) => {
        await createOutfit(db, name, clothingIds);
        router.back();
      }}
    />
  );
}
