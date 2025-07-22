'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';

interface LeadDetailsModalProps {
  lead: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    status: string;
    notes: string[];
    tags: string[];
    receivedAt: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (leadId: string, data: any) => void;
}

export function LeadDetailsModal({ lead, isOpen, onClose, onUpdate }: LeadDetailsModalProps) {
  const [status, setStatus] = useState(lead?.status || 'new');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState(lead?.tags?.join(', ') || '');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lead) return;

    try {
      await onUpdate(lead.id, {
        status,
        notes: notes ? [...(lead.notes || []), notes] : lead.notes,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean)
      });

      toast({
        title: 'Success',
        description: 'Lead updated successfully',
      });

      onClose();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update lead',
        variant: 'destructive',
      });
    }
  };

  if (!lead) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={lead.name} disabled />
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={lead.email || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={lead.phone || ''} disabled />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full p-2 border rounded"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Add Note</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add a new note..."
              />
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="hot, follow-up, etc."
              />
            </div>

            <div className="space-y-2">
              <Label>Previous Notes</Label>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {lead.notes?.map((note, index) => (
                  <div key={index} className="p-2 bg-secondary rounded">
                    {note}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Lead
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 