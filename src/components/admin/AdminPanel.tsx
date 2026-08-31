import React, { useState } from 'react';
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Check, 
  Video, 
  Sparkles, 
  FolderGit2, 
  Layers, 
  Lock, 
  ExternalLink,
  Sliders
} from 'lucide-react';
import { useSiteContent } from '../../context/SiteContentContext';
import { MediaUploader } from './MediaUploader';
import { WardrobeProject, TransformationItem, ProjectCategory } from '../../types';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ isOpen, onClose }) => {
  const {
    data,
    isLoading,
    isSaving,
    saveHeroConfig,
    saveProjects,
    saveTransformations,
    resetToDefaults,
  } = useSiteContent();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('wardrobly_admin_auth') === 'true';
  });
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState(false);

  // Active Tab: 'hero' | 'before-after' | 'portfolio'
  const [activeTab, setActiveTab] = useState<'hero' | 'before-after' | 'portfolio'>('hero');

  // Draft Editing State
  const [heroDraft, setHeroDraft] = useState(data.hero);
  const [projectsDraft, setProjectsDraft] = useState<WardrobeProject[]>(data.projects);
  const [transformationsDraft, setTransformationsDraft] = useState<TransformationItem[]>(data.transformations);
  
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);

  // Sync draft whenever real data updates
  React.useEffect(() => {
    setHeroDraft(data.hero);
    setProjectsDraft(data.projects);
    setTransformationsDraft(data.transformations);
  }, [data]);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default pass: 1987 or admin123 (customizable)
    if (passcode.trim() === '1987' || passcode.trim().toLowerCase() === 'admin' || passcode.trim() === '8888') {
      setIsAuthenticated(true);
      sessionStorage.setItem('wardrobly_admin_auth', 'true');
      setAuthError(false);
    } else {
      setAuthError(true);
    }
  };

  const showNotification = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Hero Actions
  const handleSaveHero = async () => {
    try {
      await saveHeroConfig(heroDraft);
      showNotification('Hero background & texts saved to Firebase!');
    } catch {
      alert('Failed to save Hero configuration to Firebase');
    }
  };

  // Before / After Actions
  const handleSaveTransformations = async () => {
    try {
      await saveTransformations(transformationsDraft);
      showNotification('Before & After transformations saved to Firebase!');
    } catch {
      alert('Failed to save transformations');
    }
  };

  const handleAddTransformation = () => {
    const newId = `transformation-${Date.now()}`;
    const newItem: TransformationItem = {
      id: newId,
      title: 'New Bespoke Transformation',
      subtitle: 'Walk-In Conversion',
      description: 'Custom bespoke wardrobe cabinetry with integrated illumination and luxury finishes.',
      beforeImage: data.hero.posterUrl,
      afterImage: data.hero.posterUrl,
      beforeAlt: 'Room before transformation',
      afterAlt: 'Completed luxury wardrobe interior',
      highlights: ['Custom internal organizers', 'Illuminated hanging bays', 'Soft-close hardware'],
    };
    setTransformationsDraft([newItem, ...transformationsDraft]);
  };

  const handleDeleteTransformation = (id: string) => {
    if (confirm('Delete this Before & After transformation?')) {
      setTransformationsDraft(transformationsDraft.filter((t) => t.id !== id));
    }
  };

  // Portfolio Projects Actions
  const handleSaveProjects = async () => {
    try {
      await saveProjects(projectsDraft);
      showNotification('Portfolio projects saved to Firebase!');
    } catch {
      alert('Failed to save portfolio projects');
    }
  };

  const handleAddProject = () => {
    const newId = `project-${Date.now()}`;
    const newProj: WardrobeProject = {
      id: newId,
      title: 'The Sovereign Suite',
      category: 'Walk-In',
      categoryLabel: 'WALK-IN',
      image: data.hero.posterUrl,
      galleryImages: [data.hero.posterUrl],
      description: 'A bespoke fitted wardrobe handcrafted with premium natural timber and architectural lighting.',
      details: {
        materials: ['Solid Blonde Oak', 'Brushed Brass Hardware', 'Suede Drawer Inserts'],
        dimensions: '16.0 m² Master Wardrobe Suite',
        features: [
          'Full-height illuminated garment bays',
          'Velvet jewelry & accessory drawers',
          'Integrated vanity dressing zone'
        ],
        hardware: 'Custom extruded brushed brass handles',
        lighting: '2700K concealed warm LED strip channels'
      }
    };
    setProjectsDraft([newProj, ...projectsDraft]);
  };

  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this wardrobe project?')) {
      setProjectsDraft(projectsDraft.filter((p) => p.id !== id));
    }
  };

  const handleAddGalleryImage = (projIndex: number, newImgUrl: string) => {
    if (!newImgUrl) return;
    const updated = [...projectsDraft];
    updated[projIndex].galleryImages = [...updated[projIndex].galleryImages, newImgUrl];
    setProjectsDraft(updated);
  };

  const handleRemoveGalleryImage = (projIndex: number, imgIndex: number) => {
    const updated = [...projectsDraft];
    updated[projIndex].galleryImages = updated[projIndex].galleryImages.filter((_, i) => i !== imgIndex);
    setProjectsDraft(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-hidden animate-fadeIn">
      <div className="bg-[#2A2420] text-[#FAF6F0] w-full max-w-5xl h-[92vh] rounded-2xl border border-[#C4913A]/40 shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#1E1916]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#C4913A]/20 border border-[#C4913A] flex items-center justify-center text-[#C4913A]">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-serif text-lg font-bold text-white tracking-wide">
                  Wardrobly Studio Media Manager
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 font-mono">
                  Firebase Connected
                </span>
              </div>
              <p className="text-xs text-[#8A7A6A]">
                Upload high-res photos &amp; background videos directly from your PC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccessMessage && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-600/40 animate-pulse">
                <Check className="w-3.5 h-3.5" />
                {saveSuccessMessage}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#352E2A] hover:bg-[#453C36] flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Lock Screen if Not Authenticated */}
        {!isAuthenticated ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
            <div className="w-14 h-14 rounded-full bg-[#352E2A] text-[#C4913A] border border-[#C4913A]/40 flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="font-serif text-2xl font-bold text-white mb-2">Studio Admin Access</h3>
            <p className="text-xs text-[#8A7A6A] mb-6 leading-relaxed">
              Enter your studio passkey to manage Hero video, Before/After photos, and portfolio galleries.
            </p>

            <form onSubmit={handleLogin} className="w-full space-y-4">
              <input
                type="password"
                placeholder="Enter passkey (e.g. 1987)"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setAuthError(false);
                }}
                className="w-full text-center px-4 py-3 rounded-xl bg-[#1E1916] border border-white/15 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-[#C4913A]"
                autoFocus
              />

              {authError && (
                <p className="text-xs text-red-400">Incorrect passkey. Please try again.</p>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#C4913A] text-white font-medium text-xs uppercase tracking-widest hover:bg-[#D4A34D] transition-colors shadow-lg cursor-pointer"
              >
                Unlock Media Manager
              </button>

              <p className="text-[11px] text-[#8A7A6A] pt-2">
                Tip: Default studio passkey is <span className="font-mono text-[#E8DCB8]">1987</span>
              </p>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Management Tabs */
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Tab Navigation */}
            <div className="flex items-center gap-2 px-6 py-2.5 bg-[#231E1B] border-b border-white/10 shrink-0 overflow-x-auto">
              <button
                onClick={() => setActiveTab('hero')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'hero'
                    ? 'bg-[#C4913A] text-white shadow-md'
                    : 'text-[#8A7A6A] hover:text-white hover:bg-white/5'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>1. Hero Background Video</span>
              </button>

              <button
                onClick={() => setActiveTab('before-after')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'before-after'
                    ? 'bg-[#C4913A] text-white shadow-md'
                    : 'text-[#8A7A6A] hover:text-white hover:bg-white/5'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>2. Before &amp; After Slides ({transformationsDraft.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('portfolio')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                  activeTab === 'portfolio'
                    ? 'bg-[#C4913A] text-white shadow-md'
                    : 'text-[#8A7A6A] hover:text-white hover:bg-white/5'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>3. Wardrobe Portfolio ({projectsDraft.length})</span>
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetToDefaults}
                  className="text-[11px] text-[#8A7A6A] hover:text-red-400 px-3 py-1.5 rounded hover:bg-white/5 transition-colors"
                  title="Reset all content back to factory presets"
                >
                  Reset Factory Presets
                </button>
              </div>
            </div>

            {/* Scrollable Tab Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
              
              {/* TAB 1: HERO SECTION */}
              {activeTab === 'hero' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="bg-[#1E1916] p-6 rounded-2xl border border-white/10 space-y-6">
                    <div className="border-b border-white/10 pb-4">
                      <h3 className="font-serif text-xl font-bold text-white">Hero Background Video &amp; Poster</h3>
                      <p className="text-xs text-[#8A7A6A] mt-1">
                        Upload an MP4 / WebM video from your PC to play and scrub seamlessly as visitors scroll down the page.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <MediaUploader
                        label="Hero Background Video (MP4)"
                        sublabel="Scrubbed by visitor scrolling"
                        accept="video"
                        currentValue={heroDraft.videoUrl}
                        onValueChange={(val) => setHeroDraft({ ...heroDraft, videoUrl: val })}
                        aspectRatioLabel="16:9 MP4"
                      />

                      <MediaUploader
                        label="Video Poster / Fallback Image"
                        sublabel="Shown while video loads on mobile"
                        accept="image"
                        currentValue={heroDraft.posterUrl}
                        onValueChange={(val) => setHeroDraft({ ...heroDraft, posterUrl: val })}
                        aspectRatioLabel="16:9 Image"
                      />
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#FAF6F0] mb-1">
                          Hero Eyebrow Label
                        </label>
                        <input
                          type="text"
                          value={heroDraft.eyebrow}
                          onChange={(e) => setHeroDraft({ ...heroDraft, eyebrow: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#FAF6F0] mb-1">
                          Main Headline (Use Enter for linebreaks)
                        </label>
                        <textarea
                          rows={2}
                          value={heroDraft.headline}
                          onChange={(e) => setHeroDraft({ ...heroDraft, headline: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white font-serif text-base focus:outline-none focus:border-[#C4913A]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-[#FAF6F0] mb-1">
                          Subtitle Description
                        </label>
                        <textarea
                          rows={2}
                          value={heroDraft.subheadline}
                          onChange={(e) => setHeroDraft({ ...heroDraft, subheadline: e.target.value })}
                          className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        onClick={handleSaveHero}
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-full bg-[#C4913A] hover:bg-[#D4A34D] text-white text-xs font-semibold uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-pointer transition-all"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving to Firebase...' : 'Save Hero Settings'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: BEFORE & AFTER SLIDERS */}
              {activeTab === 'before-after' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Before &amp; After Transformation Sliders</h3>
                      <p className="text-xs text-[#8A7A6A]">Upload both Before and After photos for interactive split-sliders</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAddTransformation}
                        className="px-4 py-2 rounded-full bg-[#352E2A] hover:bg-[#453C36] text-[#C4913A] border border-[#C4913A]/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Slide</span>
                      </button>
                      <button
                        onClick={handleSaveTransformations}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-full bg-[#C4913A] hover:bg-[#D4A34D] text-white text-xs font-semibold uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save All Changes'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {transformationsDraft.map((item, idx) => (
                      <div key={item.id} className="bg-[#1E1916] p-6 rounded-2xl border border-white/10 space-y-6 relative">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-mono text-[#C4913A] uppercase tracking-widest font-semibold">
                            Slide #{idx + 1}
                          </span>
                          <button
                            onClick={() => handleDeleteTransformation(item.id)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-950/40 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Remove</span>
                          </button>
                        </div>

                        {/* Images Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <MediaUploader
                            label="Before Image (From PC)"
                            sublabel="Untransformed space"
                            accept="image"
                            currentValue={item.beforeImage}
                            onValueChange={(val) => {
                              const updated = [...transformationsDraft];
                              updated[idx].beforeImage = val;
                              setTransformationsDraft(updated);
                            }}
                            aspectRatioLabel="4:3 or 16:9"
                          />

                          <MediaUploader
                            label="After Image (From PC)"
                            sublabel="Completed bespoke wardrobe"
                            accept="image"
                            currentValue={item.afterImage}
                            onValueChange={(val) => {
                              const updated = [...transformationsDraft];
                              updated[idx].afterImage = val;
                              setTransformationsDraft(updated);
                            }}
                            aspectRatioLabel="4:3 or 16:9"
                          />
                        </div>

                        {/* Metadata inputs */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Title</label>
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                const updated = [...transformationsDraft];
                                updated[idx].title = e.target.value;
                                setTransformationsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Subtitle Category</label>
                            <input
                              type="text"
                              value={item.subtitle}
                              onChange={(e) => {
                                const updated = [...transformationsDraft];
                                updated[idx].subtitle = e.target.value;
                                setTransformationsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            />
                          </div>

                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Description</label>
                            <textarea
                              rows={2}
                              value={item.description}
                              onChange={(e) => {
                                const updated = [...transformationsDraft];
                                updated[idx].description = e.target.value;
                                setTransformationsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: PORTFOLIO WARDROBES */}
              {activeTab === 'portfolio' && (
                <div className="space-y-6 max-w-4xl mx-auto">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-bold text-white">Wardrobe Portfolio &amp; Spec Sheets</h3>
                      <p className="text-xs text-[#8A7A6A]">Manage signature wardrobe showcase projects and detailed galleries</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleAddProject}
                        className="px-4 py-2 rounded-full bg-[#352E2A] hover:bg-[#453C36] text-[#C4913A] border border-[#C4913A]/50 text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Project</span>
                      </button>
                      <button
                        onClick={handleSaveProjects}
                        disabled={isSaving}
                        className="px-6 py-2 rounded-full bg-[#C4913A] hover:bg-[#D4A34D] text-white text-xs font-semibold uppercase tracking-widest flex items-center gap-2 shadow-lg cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSaving ? 'Saving...' : 'Save All Projects'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-8">
                    {projectsDraft.map((proj, pIdx) => (
                      <div key={proj.id} className="bg-[#1E1916] p-6 rounded-2xl border border-white/10 space-y-6">
                        <div className="flex items-center justify-between border-b border-white/10 pb-3">
                          <span className="text-xs font-mono text-[#C4913A] uppercase tracking-widest font-semibold">
                            Project #{pIdx + 1} · {proj.title}
                          </span>
                          <button
                            onClick={() => handleDeleteProject(proj.id)}
                            className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-950/40 text-xs flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Project</span>
                          </button>
                        </div>

                        {/* Main Cover Image */}
                        <MediaUploader
                          label="Main Cover Image (From PC)"
                          sublabel="Featured on the stacking cards showcase"
                          accept="image"
                          currentValue={proj.image}
                          onValueChange={(val) => {
                            const updated = [...projectsDraft];
                            updated[pIdx].image = val;
                            setProjectsDraft(updated);
                          }}
                          aspectRatioLabel="16:10 or 4:3"
                        />

                        {/* Gallery Images List */}
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold uppercase tracking-wider text-[#FAF6F0]">
                              Modal Gallery Images ({proj.galleryImages.length})
                            </label>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {proj.galleryImages.map((gImg, gIdx) => (
                              <div key={gIdx} className="relative aspect-video rounded-lg overflow-hidden bg-black/50 border border-white/10 group">
                                <img src={gImg} alt="Gallery" className="w-full h-full object-cover" />
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGalleryImage(pIdx, gIdx)}
                                  className="absolute top-1 right-1 p-1 bg-red-600/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Quick add gallery photo */}
                          <div className="pt-2">
                            <MediaUploader
                              label="Upload Additional Gallery Image"
                              sublabel="Adds directly to this project's gallery"
                              accept="image"
                              onValueChange={(val) => handleAddGalleryImage(pIdx, val)}
                            />
                          </div>
                        </div>

                        {/* Project Details Fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10">
                          <div>
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Project Title</label>
                            <input
                              type="text"
                              value={proj.title}
                              onChange={(e) => {
                                const updated = [...projectsDraft];
                                updated[pIdx].title = e.target.value;
                                setProjectsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Category</label>
                            <select
                              value={proj.category}
                              onChange={(e) => {
                                const updated = [...projectsDraft];
                                updated[pIdx].category = e.target.value as any;
                                updated[pIdx].categoryLabel = e.target.value.toUpperCase();
                                setProjectsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            >
                              <option value="Walk-In">Walk-In</option>
                              <option value="Fitted">Fitted</option>
                              <option value="Dressing Room">Dressing Room</option>
                              <option value="Contemporary">Contemporary</option>
                              <option value="Classic">Classic</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Dimensions</label>
                            <input
                              type="text"
                              value={proj.details?.dimensions || ''}
                              onChange={(e) => {
                                const updated = [...projectsDraft];
                                updated[pIdx].details.dimensions = e.target.value;
                                setProjectsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label className="block text-xs font-semibold text-[#FAF6F0] mb-1">Short Description</label>
                            <textarea
                              rows={2}
                              value={proj.description}
                              onChange={(e) => {
                                const updated = [...projectsDraft];
                                updated[pIdx].description = e.target.value;
                                setProjectsDraft(updated);
                              }}
                              className="w-full text-xs px-3 py-2 rounded-lg bg-[#2A2420] border border-white/15 text-white focus:outline-none focus:border-[#C4913A]"
                            />
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Status Bar */}
            <div className="px-6 py-3 bg-[#1E1916] border-t border-white/10 flex items-center justify-between text-xs text-[#8A7A6A]">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>Firestore Synced Realtime</span>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    sessionStorage.removeItem('wardrobly_admin_auth');
                    setIsAuthenticated(false);
                  }}
                  className="hover:text-[#C4913A] transition-colors"
                >
                  Lock Panel
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-1.5 rounded-full bg-[#352E2A] text-white hover:bg-[#453C36] transition-colors"
                >
                  Close &amp; View Site
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};
