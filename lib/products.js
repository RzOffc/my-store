// lib/products.js
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { v4 as uuidv4 } from 'uuid';

const COLLECTION = 'products';

export const getProducts = async () => {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.error(e);
    return [];
  }
};

export const addProduct = async (productData, imageFile) => {
  try {
    let imageUrl = productData.imageUrl || '';

    if (imageFile) {
      const imageRef = ref(storage, `products/${uuidv4()}-${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...productData,
      imageUrl,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { success: true, id: docRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const updateProduct = async (id, productData, imageFile) => {
  try {
    let imageUrl = productData.imageUrl || '';

    if (imageFile) {
      const imageRef = ref(storage, `products/${uuidv4()}-${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);
    }

    const docRef = doc(db, COLLECTION, id);
    await updateDoc(docRef, {
      ...productData,
      imageUrl,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const deleteProduct = async (id) => {
  try {
    await deleteDoc(doc(db, COLLECTION, id));
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

// Orders
export const getOrders = async () => {
  try {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
};

export const saveOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, 'orders'), {
      ...orderData,
      status: 'pending',
      createdAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (e) {
    return { success: false, error: e.message };
  }
};

export const updateOrderStatus = async (id, status) => {
  try {
    await updateDoc(doc(db, 'orders', id), { status, updatedAt: serverTimestamp() });
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
};
