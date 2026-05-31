'use client';

import { useState } from 'react';
import { Search, CheckCircle2, UserCheck, UserX, Loader2, Plus, Trash2 } from 'lucide-react';
import type { Schema } from '../../../../amplify/data/resource';
import { generateClient } from 'aws-amplify/data';
import { toast } from 'sonner';

const client = generateClient<Schema>();

interface RSVPFormProps {
  guests: Schema['Guest']['type'][];
  onUpdate: (id: string, updates: Partial<Schema['Guest']['type']>) => Promise<any>;
  wedding?: Schema['Wedding']['type'] | null;
}

interface PartyMemberForm {
  id?: string;
  firstName: string;
  lastName: string;
  mealChoice: string;
  dietaryRequirements: string;
  selectedTags: string[];
  isAttending: boolean | null;
  legacyTags: string[];
}

export default function RSVPForm({ guests, onUpdate, wedding }: RSVPFormProps) {
  const [step, setStep] = useState<'SEARCH' | 'RSVP' | 'SUCCESS'>('SEARCH');
  const [searchFirst, setSearchFirst] = useState('');
  const [searchLast, setSearchLast] = useState('');
  const [foundGuest, setFoundGuest] = useState<Schema['Guest']['type'] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  
  // Primary Guest State
  const [isAttending, setIsAttending] = useState<boolean | null>(null);
  const [mealChoice, setMealChoice] = useState('');
  const [dietaryRequirements, setDietaryRequirements] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [legacyTags, setLegacyTags] = useState<string[]>([]);
  
  // Party State
  const [partyMembers, setPartyMembers] = useState<PartyMemberForm[]>([]);
  const [publicTags, setPublicTags] = useState<Schema['GuestTag']['type'][]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPublicTags = async (weddingId: string) => {
    try {
      const { data } = await client.models.GuestTag.list({
        filter: { weddingId: { eq: weddingId }, isPublic: { eq: true } }
      });
      setPublicTags(data);
      return data;
    } catch (e) {
      console.error('Failed to fetch tags', e);
      return [];
    }
  };

  const parseGuestTags = (tagsStr: string | null | undefined, pTagNames: string[]) => {
    const allTags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const selected = allTags.filter(t => pTagNames.includes(t));
    const legacy = allTags.filter(t => !pTagNames.includes(t));
    return { selected, legacy };
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchFirst || !searchLast) return;
    
    setIsSearching(true);
    
    setTimeout(async () => {
      const match = guests.find(g => {
        const dbFirst = (g.firstName || '').toLowerCase().trim();
        const dbLast = (g.lastName || '').toLowerCase().trim();
        const searchFirstClean = searchFirst.toLowerCase().trim();
        const searchLastClean = searchLast.toLowerCase().trim();
        return dbFirst === searchFirstClean && dbLast === searchLastClean;
      });
      
      if (match) {
        const pTags = await fetchPublicTags(match.weddingId);
        const pTagNames = pTags.map(t => t.name);
        
        setFoundGuest(match);
        setIsAttending(match.rsvpStatus === 'CONFIRMED' ? true : match.rsvpStatus === 'DECLINED' ? false : null);
        setMealChoice(match.mealChoice || '');
        setDietaryRequirements(match.dietaryOther || '');
        setEmail(match.email || '');
        setPhone(match.phone || '');
        
        const { selected, legacy } = parseGuestTags(match.tags, pTagNames);
        setSelectedTags(selected);
        setLegacyTags(legacy);

        // Fetch existing party members
        try {
          const { data: linkedGuests } = await client.models.Guest.list({
            filter: { primaryGuestId: { eq: match.id } }
          });
          
          const mappedMembers = linkedGuests.map(lg => {
            const parsed = parseGuestTags(lg.tags, pTagNames);
            return {
              id: lg.id,
              firstName: lg.firstName,
              lastName: lg.lastName || '',
              mealChoice: lg.mealChoice || '',
              dietaryRequirements: lg.dietaryOther || '',
              selectedTags: parsed.selected,
              legacyTags: parsed.legacy,
              isAttending: lg.rsvpStatus === 'CONFIRMED' ? true : lg.rsvpStatus === 'DECLINED' ? false : null,
            };
          });
          setPartyMembers(mappedMembers);
        } catch (err) {
          console.error("Failed to fetch linked guests", err);
        }
        
        setStep('RSVP');
      } else {
        toast.error('We couldn\'t find your invitation. Please check the spelling or contact the couple.');
      }
      setIsSearching(false);
    }, 800);
  };

  const addPartyMember = () => {
    setPartyMembers([...partyMembers, {
      firstName: '', lastName: '', mealChoice: '', dietaryRequirements: '', selectedTags: [], legacyTags: [], isAttending: null
    }]);
  };

  const removePartyMember = (index: number) => {
    const newMembers = [...partyMembers];
    newMembers.splice(index, 1);
    setPartyMembers(newMembers);
  };

  const updatePartyMember = (index: number, updates: Partial<PartyMemberForm>) => {
    const newMembers = [...partyMembers];
    newMembers[index] = { ...newMembers[index], ...updates };
    setPartyMembers(newMembers);
  };

  const togglePartyMemberTag = (index: number, tagName: string, isChecked: boolean) => {
    const member = partyMembers[index];
    let newTags = [...member.selectedTags];
    if (isChecked) newTags.push(tagName);
    else newTags = newTags.filter(t => t !== tagName);
    updatePartyMember(index, { selectedTags: newTags });
  };

  const handleSubmitRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foundGuest || isAttending === null) return;
    
    setIsSubmitting(true);
    try {
      const primaryTags = [...legacyTags, ...selectedTags];
      await onUpdate(foundGuest.id, {
        rsvpStatus: isAttending ? 'CONFIRMED' : 'DECLINED',
        mealChoice: isAttending ? mealChoice : undefined,
        dietaryOther: isAttending ? dietaryRequirements : undefined,
        email: email || undefined,
        phone: phone || undefined,
        tags: primaryTags.length > 0 ? primaryTags.join(', ') : undefined,
      });

      for (const member of partyMembers) {
        if (!member.firstName) continue; // Skip empty
        const memberTags = [...member.legacyTags, ...member.selectedTags];
        const memberData = {
          weddingId: foundGuest.weddingId,
          primaryGuestId: foundGuest.id,
          firstName: member.firstName,
          lastName: member.lastName,
          rsvpStatus: member.isAttending === true ? 'CONFIRMED' as const : member.isAttending === false ? 'DECLINED' as const : 'PENDING' as const,
          mealChoice: member.isAttending ? member.mealChoice : undefined,
          dietaryOther: member.isAttending ? member.dietaryRequirements : undefined,
          tags: memberTags.length > 0 ? memberTags.join(', ') : undefined,
        };

        if (member.id) {
          await client.models.Guest.update({ id: member.id, ...memberData });
        } else {
          await client.models.Guest.create(memberData);
        }
      }

      setStep('SUCCESS');
    } catch (err) {
      toast.error('Failed to submit RSVP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'SUCCESS') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-auto border border-light-gray text-center">
        <div className="w-16 h-16 bg-sage/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-8 h-8 text-sage" />
        </div>
        <h2 className="text-2xl font-display text-charcoal mb-2">Thank You!</h2>
        <p className="text-mid-gray mb-6">
          Your RSVP has been received. {isAttending ? 'We can\'t wait to celebrate with you!' : 'You will be missed!'}
        </p>
        <button 
          onClick={() => {
            setStep('SEARCH');
            setSearchFirst('');
            setSearchLast('');
            setFoundGuest(null);
          }}
          className="text-sage hover:text-dark-sage font-medium text-sm underline"
        >
          RSVP for another guest
        </button>
      </div>
    );
  }

  if (step === 'RSVP' && foundGuest) {
    const maxAllowed = foundGuest.maxGuests || 1;
    const currentTotal = 1 + partyMembers.length;
    const canAddMore = currentTotal < maxAllowed;

    return (
      <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full mx-auto border border-light-gray">
        <h2 className="text-2xl font-display text-sage mb-1 text-center">
          Hi, {foundGuest.firstName}!
        </h2>
        <p className="text-mid-gray text-center mb-8 text-sm">Please let us know if you can make it.</p>
        
        <form onSubmit={handleSubmitRSVP} className="space-y-8">
          
          {/* Primary Guest Section */}
          <div className="bg-ivory/30 p-6 rounded-xl border border-light-gray">
            <h3 className="text-lg font-display text-charcoal mb-4">Your RSVP</h3>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button
                type="button"
                onClick={() => setIsAttending(true)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${
                  isAttending === true 
                    ? 'border-sage bg-sage/5 text-sage' 
                    : 'border-light-gray text-mid-gray hover:border-sage/30'
                }`}
              >
                <UserCheck className="w-6 h-6 mb-2" />
                <span className="font-medium">Accept</span>
              </button>
              <button
                type="button"
                onClick={() => setIsAttending(false)}
                className={`p-4 rounded-xl border-2 flex flex-col items-center justify-center transition-colors ${
                  isAttending === false 
                    ? 'border-red-400 bg-red-50 text-red-500' 
                    : 'border-light-gray text-mid-gray hover:border-red-200'
                }`}
              >
                <UserX className="w-6 h-6 mb-2" />
                <span className="font-medium">Decline</span>
              </button>
            </div>

            {isAttending && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                    <input 
                      type="email" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-charcoal mb-1">Phone</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
                    />
                  </div>
                </div>

                {publicTags.length > 0 && (
                  <div className="pt-2">
                    <label className="block text-sm font-medium text-charcoal mb-2">Additional Details</label>
                    <div className="flex flex-wrap gap-2">
                      {publicTags.map(tag => (
                        <label key={tag.id} className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer transition-colors ${selectedTags.includes(tag.name) ? 'border-sage bg-sage/5 text-sage' : 'border-light-gray text-charcoal hover:bg-gray-50'}`}>
                          <input 
                            type="checkbox"
                            checked={selectedTags.includes(tag.name)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedTags([...selectedTags, tag.name]);
                              else setSelectedTags(selectedTags.filter(t => t !== tag.name));
                            }}
                            className="w-4 h-4 rounded border-gray-300 text-sage focus:ring-sage"
                          />
                          <span className="text-sm">{tag.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Party Members Section */}
          {(partyMembers.length > 0 || canAddMore) && (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-light-gray pb-2">
                <h3 className="text-lg font-display text-charcoal">Your Party</h3>
                <span className="text-xs text-mid-gray uppercase tracking-wider">{currentTotal} / {maxAllowed} allowed</span>
              </div>
              
              {partyMembers.map((member, idx) => (
                <div key={member.id || idx} className="bg-white p-6 rounded-xl border border-light-gray relative shadow-sm">
                  <button type="button" onClick={() => removePartyMember(idx)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-mid-gray mb-1">First Name</label>
                      <input 
                        required
                        type="text" 
                        value={member.firstName}
                        onChange={(e) => updatePartyMember(idx, { firstName: e.target.value })}
                        className="w-full border border-light-gray rounded p-2 text-sm focus:border-sage focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-mid-gray mb-1">Last Name</label>
                      <input 
                        type="text" 
                        value={member.lastName}
                        onChange={(e) => updatePartyMember(idx, { lastName: e.target.value })}
                        className="w-full border border-light-gray rounded p-2 text-sm focus:border-sage focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button
                      type="button"
                      onClick={() => updatePartyMember(idx, { isAttending: true })}
                      className={`p-2 rounded border flex items-center justify-center text-sm transition-colors ${
                        member.isAttending === true 
                          ? 'border-sage bg-sage/5 text-sage font-medium' 
                          : 'border-light-gray text-mid-gray hover:border-sage/30'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 mr-2" /> Attending
                    </button>
                    <button
                      type="button"
                      onClick={() => updatePartyMember(idx, { isAttending: false })}
                      className={`p-2 rounded border flex items-center justify-center text-sm transition-colors ${
                        member.isAttending === false 
                          ? 'border-red-400 bg-red-50 text-red-500 font-medium' 
                          : 'border-light-gray text-mid-gray hover:border-red-200'
                      }`}
                    >
                      <UserX className="w-4 h-4 mr-2" /> Declining
                    </button>
                  </div>

                  {member.isAttending && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                      
                      {publicTags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {publicTags.map(tag => (
                            <label key={tag.id} className={`flex items-center space-x-1.5 p-1.5 px-2 border rounded cursor-pointer transition-colors ${member.selectedTags.includes(tag.name) ? 'border-sage bg-sage/5 text-sage' : 'border-light-gray text-mid-gray hover:bg-gray-50'}`}>
                              <input 
                                type="checkbox"
                                checked={member.selectedTags.includes(tag.name)}
                                onChange={(e) => togglePartyMemberTag(idx, tag.name, e.target.checked)}
                                className="w-3 h-3 rounded border-gray-300 text-sage focus:ring-sage"
                              />
                              <span className="text-xs">{tag.name}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              
              {canAddMore && (
                <button 
                  type="button" 
                  onClick={addPartyMember}
                  className="w-full border-2 border-dashed border-light-gray text-mid-gray hover:text-sage hover:border-sage hover:bg-sage/5 p-4 rounded-xl flex items-center justify-center font-medium transition-colors"
                >
                  <Plus className="w-5 h-5 mr-2" /> Add Party Member
                </button>
              )}
            </div>
          )}

          <div className="pt-6 border-t border-light-gray flex justify-between items-center">
            <button 
              type="button"
              onClick={() => setStep('SEARCH')}
              className="text-mid-gray hover:text-charcoal text-sm font-medium"
              disabled={isSubmitting}
            >
              Back
            </button>
            <button 
              type="submit"
              disabled={isAttending === null || isSubmitting || partyMembers.some(pm => pm.isAttending === null)}
              className="bg-sage text-white px-8 py-3 rounded-xl font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 flex items-center shadow-md"
            >
              {isSubmitting ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Submitting...</>
              ) : 'Submit RSVP'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // SEARCH STEP
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full mx-auto border border-light-gray">
      <h2 className="text-2xl font-display text-sage mb-6 text-center">Find Your Invitation</h2>
      
      <form onSubmit={handleSearch} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">First Name</label>
          <input 
            required
            type="text" 
            value={searchFirst}
            onChange={(e) => setSearchFirst(e.target.value)}
            className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-mid-gray mb-1">Last Name</label>
          <input 
            required
            type="text" 
            value={searchLast}
            onChange={(e) => setSearchLast(e.target.value)}
            className="w-full border border-light-gray rounded-lg p-3 focus:border-sage focus:outline-none"
          />
        </div>
        
        <button 
          type="submit"
          disabled={!searchFirst || !searchLast || isSearching}
          className="w-full bg-sage text-white py-3 rounded-lg font-medium hover:bg-dark-sage transition-colors disabled:opacity-50 mt-4 flex justify-center items-center shadow-md"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Search RSVP'}
        </button>
      </form>
    </div>
  );
}
