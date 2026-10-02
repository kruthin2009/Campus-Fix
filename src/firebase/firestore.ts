import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type QueryDocumentSnapshot,
  type SnapshotOptions,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Generic Firestore converter that trusts the document id as the `id` field
 * and passes the rest of the data through untouched. Keeps our service layer
 * free of repeated `{ id: doc.id, ...doc.data() }` boilerplate.
 */
function makeConverter<T extends { id: string }>() {
  return {
    toFirestore(model: T): DocumentData {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...rest } = model;
      return rest;
    },
    fromFirestore(
      snapshot: QueryDocumentSnapshot,
      options?: SnapshotOptions
    ): T {
      const data = snapshot.data(options);
      return { id: snapshot.id, ...data } as T;
    },
  };
}

export function typedCollection<T extends { id: string }>(
  path: string
): CollectionReference<T> {
  return collection(db, path).withConverter(makeConverter<T>());
}

export function typedSubcollection<T extends { id: string }>(
  parentPath: string,
  parentId: string,
  subcollectionName: string
): CollectionReference<T> {
  return collection(db, parentPath, parentId, subcollectionName).withConverter(
    makeConverter<T>()
  );
}

export function typedDoc<T extends { id: string }>(
  path: string,
  id: string
): DocumentReference<T> {
  return doc(db, path, id).withConverter(makeConverter<T>());
}

export { db };
