import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  db, 
  doc, 
  collection, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from '../lib/firebase';
import { WardrobeProject, TransformationItem } from '../types';
import { PROJECTS as DEFAULT_PROJECTS, TRANSFORMATIONS as DEFAULT_TRANSFORMATIONS } from '../data/wardrobeData';
import { chunkString } from '../lib/mediaUtils';
import heroVideoUrl from '../assets/hero-wardrobe.mp4';
import posterImg from '../assets/after-1.jpeg';

export interface HeroConfig {
  headline: string;
  subheadline: string;
  eyebrow: string;
  videoUrl: string;
  posterUrl: string;
}

export interface SiteMediaState {
  hero: HeroConfig;
  projects: WardrobeProject[];
  transformations: TransformationItem[];
  lastUpdated?: string;
}

const DEFAULT_STATE: SiteMediaState = {
  hero: {
    headline: "Scroll to fit\nthe wardrobe",
    subheadline: "Hand-built cabinetry, book-matched veneer and brass that will outlive the house — fitted in five days.",
    eyebrow: "Bespoke Wardrobes · Est. 1987",
    videoUrl: heroVideoUrl,
    posterUrl: posterImg,
  },
  projects: DEFAULT_PROJECTS,
  transformations: DEFAULT_TRANSFORMATIONS,
};

interface SiteContentContextType {
  data: SiteMediaState;
  isLoading: boolean;
  isSaving: boolean;
  saveHeroConfig: (hero: Partial<HeroConfig>) => Promise<void>;
  saveProjects: (projects: WardrobeProject[]) => Promise<void>;
  updateProject: (project: WardrobeProject) => Promise<void>;
  addProject: (project: WardrobeProject) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  saveTransformations: (transformations: TransformationItem[]) => Promise<void>;
  updateTransformation: (item: TransformationItem) => Promise<void>;
  addTransformation: (item: TransformationItem) => Promise<void>;
  deleteTransformation: (id: string) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const SiteContentContext = createContext<SiteContentContextType | null>(null);

export const SiteContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<SiteMediaState>(() => {
    try {
      const cached = localStorage.getItem('wardrobly_site_content_v2');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // ignore
    }
    return DEFAULT_STATE;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Helper to reassemble chunked video if present
  const loadHeroVideoChunks = async (totalChunks: number): Promise<string> => {
    try {
      const chunkPromises: Promise<string>[] = [];
      for (let i = 0; i < totalChunks; i++) {
        const chunkDocRef = doc(db, 'site_hero_video', `chunk_${i}`);
        chunkPromises.push(
          getDoc(chunkDocRef).then((snap) => {
            if (snap.exists()) {
              return snap.data().chunk as string;
            }
            return '';
          })
        );
      }
      const chunks = await Promise.all(chunkPromises);
      return chunks.join('');
    } catch (err) {
      console.warn('Failed to load hero video chunks:', err);
      return heroVideoUrl;
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Listen to Hero doc
    const heroDocRef = doc(db, 'site_content', 'hero');
    const unsubHero = onSnapshot(heroDocRef, async (snap) => {
      if (!isMounted) return;
      if (snap.exists()) {
        const heroData = snap.data();
        let videoUrl = heroData.videoUrl || DEFAULT_STATE.hero.videoUrl;

        if (heroData.hasVideoChunks && typeof heroData.totalVideoChunks === 'number') {
          const stitched = await loadHeroVideoChunks(heroData.totalVideoChunks);
          if (stitched) {
            videoUrl = stitched;
          }
        }

        setData((prev) => {
          if (
            prev.hero.headline === heroData.headline &&
            prev.hero.subheadline === heroData.subheadline &&
            prev.hero.eyebrow === heroData.eyebrow &&
            prev.hero.posterUrl === heroData.posterUrl &&
            prev.hero.videoUrl === videoUrl
          ) {
            return prev;
          }

          const next = {
            ...prev,
            hero: {
              headline: heroData.headline ?? prev.hero.headline,
              subheadline: heroData.subheadline ?? prev.hero.subheadline,
              eyebrow: heroData.eyebrow ?? prev.hero.eyebrow,
              posterUrl: heroData.posterUrl ?? prev.hero.posterUrl,
              videoUrl: videoUrl,
            },
          };
          try {
            localStorage.setItem('wardrobly_site_content_v2', JSON.stringify(next));
          } catch {
            // quota fallback
          }
          return next;
        });
      }
    });

    // 2. Listen to Projects Collection
    const projectsColRef = collection(db, 'site_projects');
    const unsubProjects = onSnapshot(projectsColRef, (snapshot) => {
      if (!isMounted) return;
      if (!snapshot.empty) {
        const loadedProjects: WardrobeProject[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as WardrobeProject;
          loadedProjects.push(item);
        });

        if (loadedProjects.length > 0) {
          setData((prev) => {
            const next = {
              ...prev,
              projects: loadedProjects,
            };
            try {
              localStorage.setItem('wardrobly_site_content_v2', JSON.stringify(next));
            } catch {
              // quota fallback
            }
            return next;
          });
        }
      }
    });

    // 3. Listen to Transformations Collection
    const transfColRef = collection(db, 'site_transformations');
    const unsubTransf = onSnapshot(transfColRef, (snapshot) => {
      if (!isMounted) return;
      if (!snapshot.empty) {
        const loadedTransformations: TransformationItem[] = [];
        snapshot.forEach((docSnap) => {
          const item = docSnap.data() as TransformationItem;
          loadedTransformations.push(item);
        });

        if (loadedTransformations.length > 0) {
          setData((prev) => {
            const next = {
              ...prev,
              transformations: loadedTransformations,
            };
            try {
              localStorage.setItem('wardrobly_site_content_v2', JSON.stringify(next));
            } catch {
              // quota fallback
            }
            return next;
          });
        }
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubHero();
      unsubProjects();
      unsubTransf();
    };
  }, []);

  // Save Hero Config (handles video chunking safely)
  const saveHeroConfig = async (heroUpdates: Partial<HeroConfig>) => {
    setIsSaving(true);
    try {
      const mergedHero = { ...data.hero, ...heroUpdates };
      const heroDocRef = doc(db, 'site_content', 'hero');

      // Update state locally immediately
      setData((prev) => {
        const next = { ...prev, hero: mergedHero };
        try {
          localStorage.setItem('wardrobly_site_content_v2', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // If video is base64 and > 400KB, chunk it into separate subdocs
      if (mergedHero.videoUrl && mergedHero.videoUrl.startsWith('data:') && mergedHero.videoUrl.length > 400000) {
        const chunks = chunkString(mergedHero.videoUrl, 450000); // 450KB each
        
        // Save each chunk
        const batch = writeBatch(db);
        chunks.forEach((chunk, index) => {
          const chunkDocRef = doc(db, 'site_hero_video', `chunk_${index}`);
          batch.set(chunkDocRef, { index, chunk, updatedAt: new Date().toISOString() });
        });
        await batch.commit();

        // Save hero metadata pointing to chunks
        await setDoc(heroDocRef, {
          headline: mergedHero.headline,
          subheadline: mergedHero.subheadline,
          eyebrow: mergedHero.eyebrow,
          posterUrl: mergedHero.posterUrl,
          hasVideoChunks: true,
          totalVideoChunks: chunks.length,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } else {
        // Small or URL video
        await setDoc(heroDocRef, {
          headline: mergedHero.headline,
          subheadline: mergedHero.subheadline,
          eyebrow: mergedHero.eyebrow,
          posterUrl: mergedHero.posterUrl,
          videoUrl: mergedHero.videoUrl,
          hasVideoChunks: false,
          totalVideoChunks: 0,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    } catch (err) {
      console.error('Failed to save Hero to Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Save multiple projects (each project in its own document)
  const saveProjects = async (projects: WardrobeProject[]) => {
    setIsSaving(true);
    try {
      setData((prev) => {
        const next = { ...prev, projects };
        try {
          localStorage.setItem('wardrobly_site_content_v2', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      // Save each project in its own document
      for (const project of projects) {
        const projDocRef = doc(db, 'site_projects', project.id);
        await setDoc(projDocRef, {
          ...project,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to save projects to Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateProject = async (updated: WardrobeProject) => {
    setIsSaving(true);
    try {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => (p.id === updated.id ? updated : p)),
      }));
      const projDocRef = doc(db, 'site_projects', updated.id);
      await setDoc(projDocRef, { ...updated, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to update project in Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addProject = async (newProj: WardrobeProject) => {
    setIsSaving(true);
    try {
      setData((prev) => ({
        ...prev,
        projects: [newProj, ...prev.projects],
      }));
      const projDocRef = doc(db, 'site_projects', newProj.id);
      await setDoc(projDocRef, { ...newProj, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to add project in Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteProject = async (projectId: string) => {
    setIsSaving(true);
    try {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.filter((p) => p.id !== projectId),
      }));
      const projDocRef = doc(db, 'site_projects', projectId);
      await deleteDoc(projDocRef);
    } catch (err) {
      console.error('Failed to delete project in Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Save Transformations (each transformation in its own document)
  const saveTransformations = async (transformations: TransformationItem[]) => {
    setIsSaving(true);
    try {
      setData((prev) => {
        const next = { ...prev, transformations };
        try {
          localStorage.setItem('wardrobly_site_content_v2', JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });

      for (const item of transformations) {
        const itemDocRef = doc(db, 'site_transformations', item.id);
        await setDoc(itemDocRef, {
          ...item,
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error('Failed to save transformations to Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const updateTransformation = async (updated: TransformationItem) => {
    setIsSaving(true);
    try {
      setData((prev) => ({
        ...prev,
        transformations: prev.transformations.map((t) => (t.id === updated.id ? updated : t)),
      }));
      const itemDocRef = doc(db, 'site_transformations', updated.id);
      await setDoc(itemDocRef, { ...updated, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to update transformation in Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addTransformation = async (newItem: TransformationItem) => {
    setIsSaving(true);
    try {
      setData((prev) => ({
        ...prev,
        transformations: [newItem, ...prev.transformations],
      }));
      const itemDocRef = doc(db, 'site_transformations', newItem.id);
      await setDoc(itemDocRef, { ...newItem, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.error('Failed to add transformation in Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTransformation = async (id: string) => {
    setIsSaving(true);
    try {
      setData((prev) => ({
        ...prev,
        transformations: prev.transformations.filter((t) => t.id !== id),
      }));
      const itemDocRef = doc(db, 'site_transformations', id);
      await deleteDoc(itemDocRef);
    } catch (err) {
      console.error('Failed to delete transformation in Firestore:', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = async () => {
    setIsSaving(true);
    try {
      setData(DEFAULT_STATE);
      try {
        localStorage.removeItem('wardrobly_site_content_v2');
      } catch {
        // ignore
      }

      // Reset Hero
      await saveHeroConfig(DEFAULT_STATE.hero);
      // Reset Projects
      await saveProjects(DEFAULT_STATE.projects);
      // Reset Transformations
      await saveTransformations(DEFAULT_STATE.transformations);
    } catch (err) {
      console.error('Failed to reset defaults:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SiteContentContext.Provider
      value={{
        data,
        isLoading,
        isSaving,
        saveHeroConfig,
        saveProjects,
        updateProject,
        addProject,
        deleteProject,
        saveTransformations,
        updateTransformation,
        addTransformation,
        deleteTransformation,
        resetToDefaults,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
};

export const useSiteContent = () => {
  const context = useContext(SiteContentContext);
  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider');
  }
  return context;
};
