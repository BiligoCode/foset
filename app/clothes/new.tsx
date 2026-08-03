import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';

import { ClothingForm } from '../../src/components/ClothingForm';
import { createClothingItem } from '../../src/db/clothes';

export default function NewClothingScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  return (
    <ClothingForm
      submitLabel="Save item"
      onSubmit={async (input) => {
        await createClothingItem(db, input);
        router.back();
      }}
    />
  );
}
