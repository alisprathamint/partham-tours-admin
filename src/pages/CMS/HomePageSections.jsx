import React, { useState, useEffect, useRef } from 'react';
import { Save, Plus, Trash2, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axios';
import { getImageUrl } from '../../utils/imageHelper';

const HomePageSections = () => {
  const [activeTab, setActiveTab] = useState('hero');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pre-filled defaults from the actual website content
  const defaultHeroSlides = [
    { title: "Best Travel Packages in India - Domestic & International Tours", subtitle: "Discover incredible India with our premium holiday packages. Goa beaches, Kerala backwaters, Himachal mountains - all at unbeatable prices", image: "/assets/hero/hero-background-1.webp" },
    { title: "International Holiday Packages - Bali, Thailand, Vietnam Tours", subtitle: "Explore exotic destinations with our affordable international tour packages. Bali temples, Thailand beaches, Vietnam culture - book now!", image: "/assets/hero/hero-background-2.webp" },
    { title: "Family Vacation & Honeymoon Packages - Create Lasting Memories", subtitle: "Perfect family holidays and romantic honeymoon packages tailored for you. Adventure tours, cultural trips, beach vacations - all inclusive deals", image: "/assets/hero/hero-background-3.webp" }
  ];

  const defaultOffers = [
    { days: "7 Days", title: "Highlights of Europe", price: "₹1,59,000", active: true },
    { days: "9 Days", title: "Best of Europe", price: "₹1,98,000", active: false },
    { days: "14 Days", title: "All of Europe", price: "₹3,25,000", active: false }
  ];

  const defaultWhyChooseFeatures = [
    { icon: "fas fa-headset", title: "24/7 Expert Support", description: "Our travel experts are available round the clock to assist you at every step of your journey." },
    { icon: "fas fa-tags", title: "Best Price Guarantee", description: "We offer the most competitive rates in the market without compromising on quality." },
    { icon: "fas fa-user-tie", title: "Expert Tour Managers", description: "Travel with our experienced, friendly, and knowledgeable tour managers who ensure a hassle-free journey." },
    { icon: "fas fa-shield-alt", title: "Safe & Secure", description: "Your safety is our priority. We partner only with verified and trusted travel associates." }
  ];

  const defaultTestimonials = [
    { name: "James Brown", location: "CEO Saving Company", text: "Sodales ut etiam sit amet nisl. Semper feugiat nibh sed pulvinar pellentesque mauris.", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80", rating: 5 },
    { name: "Hindley Earnshaw", location: "@Hindley_Ea", text: "Congue mauris rhoncus aenean vel elit. Morbi non arcu risus quis varius tincidunt.", image: "https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?auto=format&fit=crop&w=150&q=80", rating: 5 },
    { name: "Linda Blair", location: "Happy Traveler", text: "Morbi non arcu risus quis varius. Tincidunt augue interdum velit euismod.", image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80", rating: 5 },
    { name: "Good Job!", location: "Happy Traveler", text: "Semper feugiat nibh sed pulvinar proin gravida facilisi morbi tempus iaculis phasellus.", image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80", rating: 5 },
    { name: "Victoria Watson", location: "Travel Blogger", text: "Diam maecenas ultricies mi eget. In nulla posuere sollicitudin aliquam. Adipiscing enim eu turpis egestas.", image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80", rating: 5 },
    { name: "Isabella Lipton", location: "Photographer", text: "Sodales ut etiam sit amet nisl. Semper feugiat nibh sed pulvinar proin amet nulla morbi eu non gravida.", image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80", rating: 5 },
    { name: "Basil Hallward", location: "Co-Founder", text: "Enim lobortis scelerisque fermentum dui faucibus. Sodales ut etiam sit amet nisl. Semper feugiat nibh.", image: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80", rating: 5 }
  ];

  const defaultHappyImages = [
    { url: "/assets/packages/Bali1.webp" },
    { url: "/assets/packages/Dubai1.webp" },
    { url: "/assets/packages/Goa1.webp" },
    { url: "/assets/packages/Thailand1.webp" },
    { url: "/assets/packages/Singapore1.webp" },
    { url: "/assets/packages/Vietnam1.webp" }
  ];

  const [formData, setFormData] = useState({
    // Hero Section
    homeHeroSlides: JSON.stringify(defaultHeroSlides),
    
    // Offers Section
    homeOffersTitle: 'Special Offers',
    homeOffersSubtitle: 'Grab our exclusive limited-time deals and make your dream vacation a reality.',
    homeOffers: JSON.stringify(defaultOffers),
    homeOffersBannerHeading: '5,000 Years Ancient. 50 Years Ahead.',
    homeOffersBannerSubtext: 'Visit all-inclusive EUROPE tours with Pratham Tours',
    homeOffersBannerImage: '/assets/hero/packages-header.webp',
    
    // Popular Destinations
    homeDestinationsTitle: 'Popular Destinations',
    homeDestinationsSubtitle: 'Explore the most loved destinations',
    
    // Popular Packages
    homePackagesTitle: 'Popular Travel Packages - Best Holiday Deals',
    homePackagesSubtitle: 'Handpicked tour packages with best prices. Domestic India tours & international vacation packages',
    
    // Why Choose Us
    homeWhyChooseTitle: 'Why Choose Pratham Tours?',
    homeWhyChooseSubtitle: 'We are committed to providing you with the best travel experiences, ensuring every journey is memorable, safe, and perfectly tailored to your dreams.',
    homeWhyChooseFeatures: JSON.stringify(defaultWhyChooseFeatures),
    
    // Testimonials
    homeTestimonialsTitle: 'What Our Clients Say',
    homeTestimonialsSubtitle: 'Real experiences from our valued travelers',
    homeTestimonials: JSON.stringify(defaultTestimonials),
    
    // Happy Customers
    homeHappyCustomersTitle: 'Our Happy Customers',
    homeHappyCustomersSubtitle: 'Glimpses of unforgettable memories created with Pratham Tours',
    homeHappyCustomersImages: JSON.stringify(defaultHappyImages),
    
    // Monthly Destinations
    homeMonthlyTitle: 'Best Destinations for this Month',
    homeMonthlySubtitle: 'Discover the perfect places to visit this month',
  });

  const fileInputRef = useRef(null);
  const [uploadingField, setUploadingField] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  const toggleItem = (section, index) => {
    const key = `${section}-${index}`;
    setExpandedItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const isItemExpanded = (section, index) => {
    return expandedItems[`${section}-${index}`] !== false; // default expanded
  };

  useEffect(() => {
    api.get('/settings')
      .then(res => res.data)
      .then(data => {
        if (data.success && data.data) {
          setFormData(prev => ({ ...prev, ...data.data }));
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error('Error fetching settings:', err);
        setIsLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const parseJsonSafe = (str, fallback = []) => {
    try {
      if (typeof str !== 'string') return str || fallback;
      
      // Unescape HTML entities if the backend sanitized the JSON string
      let unescapedStr = str;
      while (unescapedStr.includes('&amp;')) unescapedStr = unescapedStr.replace(/&amp;/g, '&');
      unescapedStr = unescapedStr.replace(/&quot;/g, '"').replace(/&#x2F;/ig, '/').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");

      try {
        return JSON.parse(unescapedStr);
      } catch (e) {
        try {
          // eslint-disable-next-line no-eval
          return eval('(' + unescapedStr + ')');
        } catch (e2) {
          return fallback;
        }
      }
    } catch {
      return fallback;
    }
  };

  const handleArrayChange = (arrayName, index, field, value) => {
    const arr = parseJsonSafe(formData[arrayName]);
    if (arr[index]) {
      arr[index][field] = value;
      setFormData(prev => ({ ...prev, [arrayName]: JSON.stringify(arr) }));
    }
  };

  const addArrayItem = (arrayName, emptyItem) => {
    const arr = parseJsonSafe(formData[arrayName]);
    arr.push(emptyItem);
    setFormData(prev => ({ ...prev, [arrayName]: JSON.stringify(arr) }));
  };

  const removeArrayItem = (arrayName, index) => {
    const arr = parseJsonSafe(formData[arrayName]);
    arr.splice(index, 1);
    setFormData(prev => ({ ...prev, [arrayName]: JSON.stringify(arr) }));
  };

  const triggerImageUpload = (fieldName, index = null, arrayName = null) => {
    setUploadingField({ fieldName, index, arrayName });
    fileInputRef.current.click();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append('file', file);

    try {
      const res = await api.post('/upload', data);
      const result = res.data;
      
      if (result.success && result.file.url) {
        if (uploadingField.arrayName) {
           handleArrayChange(uploadingField.arrayName, uploadingField.index, uploadingField.fieldName, result.file.url);
        } else {
           setFormData(prev => ({ ...prev, [uploadingField.fieldName]: result.file.url }));
        }
      } else {
        alert('Image upload failed');
      }
    } catch (error) {
      console.error(error);
      alert('Error uploading image');
    }
    
    e.target.value = '';
    setUploadingField(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.post('/settings', formData);
      const data = response.data;
      if (data.success) {
        alert('Home Page sections updated successfully!');
      } else {
        alert('Failed to update settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('An error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reusable Image Field
  const ImageField = ({ label, value, onChange, onUpload }) => {
    // Unescape HTML entities from sanitized image URLs
    let displayValue = value;
    if (typeof displayValue === 'string') {
      while (displayValue.includes('&amp;')) displayValue = displayValue.replace(/&amp;/g, '&');
      displayValue = displayValue.replace(/&quot;/g, '"').replace(/&#x2F;/ig, '/').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&#39;/g, "'");
    }
    
    // Use centralized getImageUrl if it's an uploaded image
    if (typeof displayValue === 'string' && displayValue.startsWith('/uploads')) {
      displayValue = getImageUrl(displayValue);
    }

    return (
      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
        <div className="flex gap-2">
          <input type="text" value={displayValue || ''} onChange={onChange} className="flex-1 px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" placeholder="Image URL or upload" />
          <button onClick={onUpload} className="px-3 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm flex items-center gap-2 text-sm flex-shrink-0 font-medium">
            <ImageIcon size={16} /> Upload
          </button>
        </div>
        {displayValue && (
          <img src={displayValue} alt="Preview" className="mt-3 h-28 w-48 object-cover rounded-xl border border-slate-200 shadow-sm" onError={(e) => { e.target.style.display = 'none'; }} />
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[400px]">
        <div className="text-slate-700 flex items-center gap-2">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          Loading settings...
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'hero', label: '🖼️ Hero Slides' },
    { id: 'offers', label: '🏷️ Offers' },
    { id: 'destinations', label: '📍 Destinations' },
    { id: 'packages', label: '📦 Packages' },
    { id: 'whyChoose', label: '✅ Why Choose Us' },
    { id: 'testimonials', label: '💬 Testimonials' },
    { id: 'happy', label: '😊 Happy Customers' },
    { id: 'monthly', label: '📅 Monthly' },
  ];

  return (
    <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-8 relative z-10">
      {/* Hidden file input for images */}
      <input type="file" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} accept="image/*" />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700 tracking-tight">Home Page Content</h2>
          <p className="text-slate-700 mt-1">Edit all sections of the home page with pre-filled content.</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white px-6 py-2.5 rounded-xl font-medium transition-all duration-300 disabled:opacity-50 shadow-lg shadow-blue-200 hover:shadow-blue-300 transform hover:-translate-y-0.5">
          <Save size={20} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-xl shadow-blue-100/40 border border-slate-200/60 overflow-hidden flex flex-col lg:flex-row min-h-[700px]">
        {/* Vertical Tabs */}
        <div className="w-full lg:w-64 bg-slate-50/50 border-b lg:border-b-0 lg:border-r border-slate-200/60 flex-shrink-0 p-3">
          <div className="flex flex-row lg:flex-col p-3 gap-1 overflow-x-auto lg:overflow-visible">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-3 rounded-xl text-left text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-md shadow-blue-200 font-semibold'
                    : 'text-slate-800 hover:bg-white hover:text-blue-700 hover:shadow-sm'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
          
          {/* ==================== HERO SLIDES ==================== */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-blue-950">Hero Slides</h3>
                <button onClick={() => addArrayItem('homeHeroSlides', { title: '', subtitle: '', image: '' })} className="text-sm bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-semibold border border-blue-100/50">
                  <Plus size={16} /> Add Slide
                </button>
              </div>
              
              <div className="space-y-3">
                {parseJsonSafe(formData.homeHeroSlides).map((slide, index) => (
                  <div key={index} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => toggleItem('hero', index)}>
                      <div className="flex items-center gap-3">
                        {slide.image && <img src={getImageUrl(slide.image)} alt="" className="h-10 w-16 object-cover rounded" onError={(e) => { e.target.style.display = 'none'; }} />}
                        <div>
                          <span className="font-medium text-slate-700 text-sm">Slide {index + 1}</span>
                          <span className="text-slate-800 text-xs ml-2">{slide.title?.substring(0, 40)}...</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removeArrayItem('homeHeroSlides', index); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                        {isItemExpanded('hero', index) ? <ChevronUp size={16} className="text-slate-800" /> : <ChevronDown size={16} className="text-slate-800" />}
                      </div>
                    </div>
                    {isItemExpanded('hero', index) && (
                      <div className="p-5 space-y-5 border-t border-slate-100/80">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                          <input type="text" value={slide.title || ''} onChange={(e) => handleArrayChange('homeHeroSlides', index, 'title', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtitle</label>
                          <textarea value={slide.subtitle || ''} onChange={(e) => handleArrayChange('homeHeroSlides', index, 'subtitle', e.target.value)} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" rows="2" />
                        </div>
                        <ImageField 
                          label="Background Image" 
                          value={slide.image} 
                          onChange={(e) => handleArrayChange('homeHeroSlides', index, 'image', e.target.value)}
                          onUpload={() => triggerImageUpload('image', index, 'homeHeroSlides')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== OFFERS ==================== */}
          {activeTab === 'offers' && (
            <div className="space-y-8">
              {/* Section Titles */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-950">Section Titles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                    <input type="text" name="homeOffersTitle" value={formData.homeOffersTitle || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtitle</label>
                    <input type="text" name="homeOffersSubtitle" value={formData.homeOffersSubtitle || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" />
                  </div>
                </div>
              </div>

              {/* Banner Content */}
              <div className="space-y-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <h4 className="font-semibold text-slate-700">Banner Content</h4>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Banner Heading</label>
                  <input type="text" name="homeOffersBannerHeading" value={formData.homeOffersBannerHeading || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Banner Subtext</label>
                  <input type="text" name="homeOffersBannerSubtext" value={formData.homeOffersBannerSubtext || ''} onChange={handleChange} className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 text-sm shadow-sm" />
                </div>
                <ImageField 
                  label="Banner Image" 
                  value={formData.homeOffersBannerImage} 
                  onChange={(e) => setFormData(prev => ({ ...prev, homeOffersBannerImage: e.target.value }))}
                  onUpload={() => triggerImageUpload('homeOffersBannerImage')}
                />
              </div>

              {/* Offer Cards */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">Offer Cards</h4>
                  <button onClick={() => addArrayItem('homeOffers', { days: '', title: '', price: '', active: false })} className="text-sm bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-semibold border border-blue-100/50">
                    <Plus size={16} /> Add Offer
                  </button>
                </div>
                {parseJsonSafe(formData.homeOffers).map((offer, index) => (
                  <div key={index} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => toggleItem('offer', index)}>
                      <span className="font-medium text-slate-700 text-sm">{offer.title || `Offer ${index + 1}`} — {offer.days} — {offer.price}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removeArrayItem('homeOffers', index); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        {isItemExpanded('offer', index) ? <ChevronUp size={16} className="text-slate-800" /> : <ChevronDown size={16} className="text-slate-800" />}
                      </div>
                    </div>
                    {isItemExpanded('offer', index) && (
                      <div className="p-5 grid grid-cols-2 gap-5 border-t border-slate-100/80">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Days</label>
                          <input type="text" value={offer.days || ''} onChange={(e) => handleArrayChange('homeOffers', index, 'days', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                          <input type="text" value={offer.title || ''} onChange={(e) => handleArrayChange('homeOffers', index, 'title', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price</label>
                          <input type="text" value={offer.price || ''} onChange={(e) => handleArrayChange('homeOffers', index, 'price', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                        </div>
                        <div className="flex items-end pb-1">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="checkbox" checked={offer.active || false} onChange={(e) => handleArrayChange('homeOffers', index, 'active', e.target.checked)} className="w-4 h-4 text-blue-600 rounded" />
                            <span className="text-sm font-medium text-slate-700">Highlight Active</span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== DESTINATIONS ==================== */}
          {activeTab === 'destinations' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-blue-950">Popular Destinations</h3>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-center gap-3">
                ℹ️ Destination items are loaded from your <strong>Tours & Travels → Destinations</strong> module. You can change the section headings here.
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Title</label>
                  <input type="text" name="homeDestinationsTitle" value={formData.homeDestinationsTitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Subtitle</label>
                  <input type="text" name="homeDestinationsSubtitle" value={formData.homeDestinationsSubtitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ==================== PACKAGES ==================== */}
          {activeTab === 'packages' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-blue-950">Popular Packages</h3>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-center gap-3">
                ℹ️ Package items are loaded from your <strong>Tours & Travels → Packages</strong> module. You can change the section headings here.
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Title</label>
                  <input type="text" name="homePackagesTitle" value={formData.homePackagesTitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Subtitle</label>
                  <input type="text" name="homePackagesSubtitle" value={formData.homePackagesSubtitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* ==================== WHY CHOOSE US ==================== */}
          {activeTab === 'whyChoose' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-950">Why Choose Us</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                    <input type="text" name="homeWhyChooseTitle" value={formData.homeWhyChooseTitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtitle</label>
                    <textarea name="homeWhyChooseSubtitle" value={formData.homeWhyChooseSubtitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" rows="2" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">Features</h4>
                  <button onClick={() => addArrayItem('homeWhyChooseFeatures', { icon: 'fas fa-star', title: '', description: '' })} className="text-sm bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-semibold border border-blue-100/50">
                    <Plus size={16} /> Add Feature
                  </button>
                </div>
                {parseJsonSafe(formData.homeWhyChooseFeatures).map((feature, index) => (
                  <div key={index} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => toggleItem('feature', index)}>
                      <span className="font-medium text-slate-700 text-sm">
                        <i className={feature.icon + ' mr-2 text-blue-500'}></i>
                        {feature.title || `Feature ${index + 1}`}
                      </span>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removeArrayItem('homeWhyChooseFeatures', index); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        {isItemExpanded('feature', index) ? <ChevronUp size={16} className="text-slate-800" /> : <ChevronDown size={16} className="text-slate-800" />}
                      </div>
                    </div>
                    {isItemExpanded('feature', index) && (
                      <div className="p-5 space-y-5 border-t border-slate-100/80">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Icon (FontAwesome)</label>
                            <input type="text" value={feature.icon || ''} onChange={(e) => handleArrayChange('homeWhyChooseFeatures', index, 'icon', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" placeholder="fas fa-star" />
                          </div>
                          <div className="col-span-2">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                            <input type="text" value={feature.title || ''} onChange={(e) => handleArrayChange('homeWhyChooseFeatures', index, 'title', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                          <textarea value={feature.description || ''} onChange={(e) => handleArrayChange('homeWhyChooseFeatures', index, 'description', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" rows="2" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== TESTIMONIALS ==================== */}
          {activeTab === 'testimonials' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-950">Testimonials</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                    <input type="text" name="homeTestimonialsTitle" value={formData.homeTestimonialsTitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtitle</label>
                    <input type="text" name="homeTestimonialsSubtitle" value={formData.homeTestimonialsSubtitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">Reviews</h4>
                  <button onClick={() => addArrayItem('homeTestimonials', { name: '', location: '', rating: 5, text: '', image: '' })} className="text-sm bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-semibold border border-blue-100/50">
                    <Plus size={16} /> Add Review
                  </button>
                </div>
                {parseJsonSafe(formData.homeTestimonials).map((testimonial, index) => (
                  <div key={index} className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between px-5 py-4 bg-slate-50/50 hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => toggleItem('testimonial', index)}>
                      <div className="flex items-center gap-3">
                        {testimonial.image && <img src={getImageUrl(testimonial.image)} alt="" className="h-8 w-8 rounded-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />}
                        <span className="font-medium text-slate-700 text-sm">{testimonial.name || `Review ${index + 1}`}</span>
                        <span className="text-yellow-500 text-xs">{'★'.repeat(testimonial.rating || 5)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); removeArrayItem('homeTestimonials', index); }} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"><Trash2 size={16} /></button>
                        {isItemExpanded('testimonial', index) ? <ChevronUp size={16} className="text-slate-800" /> : <ChevronDown size={16} className="text-slate-800" />}
                      </div>
                    </div>
                    {isItemExpanded('testimonial', index) && (
                      <div className="p-5 space-y-5 border-t border-slate-100/80">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name</label>
                            <input type="text" value={testimonial.name || ''} onChange={(e) => handleArrayChange('homeTestimonials', index, 'name', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Location / Role</label>
                            <input type="text" value={testimonial.location || ''} onChange={(e) => handleArrayChange('homeTestimonials', index, 'location', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Rating (1-5)</label>
                            <select value={testimonial.rating || 5} onChange={(e) => handleArrayChange('homeTestimonials', index, 'rating', Number(e.target.value))} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm">
                              {[1,2,3,4,5].map(r => <option key={r} value={r}>{r} Star{r > 1 ? 's' : ''}</option>)}
                            </select>
                          </div>
                          <ImageField 
                            label="Profile Image" 
                            value={testimonial.image} 
                            onChange={(e) => handleArrayChange('homeTestimonials', index, 'image', e.target.value)}
                            onUpload={() => triggerImageUpload('image', index, 'homeTestimonials')}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Review Text</label>
                          <textarea value={testimonial.text || ''} onChange={(e) => handleArrayChange('homeTestimonials', index, 'text', e.target.value)} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" rows="3" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ==================== HAPPY CUSTOMERS ==================== */}
          {activeTab === 'happy' && (
            <div className="space-y-8">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-blue-950">Happy Customers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Title</label>
                    <input type="text" name="homeHappyCustomersTitle" value={formData.homeHappyCustomersTitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtitle</label>
                    <input type="text" name="homeHappyCustomersSubtitle" value={formData.homeHappyCustomersSubtitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-slate-700">Gallery Images</h4>
                  <button onClick={() => addArrayItem('homeHappyCustomersImages', { url: '' })} className="text-sm bg-blue-50 text-blue-700 px-4 py-2.5 rounded-xl hover:bg-blue-100 hover:shadow-sm transition-all duration-200 flex items-center gap-2 font-semibold border border-blue-100/50">
                    <Plus size={16} /> Add Image
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {parseJsonSafe(formData.homeHappyCustomersImages).map((img, index) => (
                    <div key={index} className="border border-slate-200 rounded-xl p-4 bg-white relative group">
                      <button onClick={() => removeArrayItem('homeHappyCustomersImages', index)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-white rounded-full p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 size={14} />
                      </button>
                      {img.url && <img src={getImageUrl(img.url)} alt={`Gallery ${index + 1}`} className="w-full h-32 object-cover rounded-lg mb-3" onError={(e) => { e.target.style.display = 'none'; }} />}
                      <div className="flex gap-2">
                        <input type="text" value={img.url || ''} onChange={(e) => handleArrayChange('homeHappyCustomersImages', index, 'url', e.target.value)} className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none text-xs" placeholder="Image URL" />
                        <button onClick={() => triggerImageUpload('url', index, 'homeHappyCustomersImages')} className="px-2 py-2 bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 border border-slate-300 flex-shrink-0">
                          <ImageIcon size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ==================== MONTHLY ==================== */}
          {activeTab === 'monthly' && (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-blue-950">Monthly Destinations</h3>
              <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800 flex items-center gap-3">
                ℹ️ Monthly destination items are loaded from your <strong>Tours & Travels → Destinations</strong> module based on favorable months. You can change the section headings here.
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Title</label>
                  <input type="text" name="homeMonthlyTitle" value={formData.homeMonthlyTitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Section Subtitle</label>
                  <input type="text" name="homeMonthlySubtitle" value={formData.homeMonthlySubtitle || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg outline-none text-sm" />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default HomePageSections;
