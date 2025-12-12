import { useState } from 'react';

interface TagManagementPanelProps {
  existingTags: string[];
  onClose: () => void;
  onRenameTag: (oldTag: string, newTag: string) => Promise<void>;
  onDeleteTag: (tag: string) => Promise<void>;
  onMergeTags: (sourceTags: string[], targetTag: string) => Promise<void>;
  onConditionalTag: (conditionTag: string, tagToAdd: string) => Promise<void>;
  darkMode?: boolean;
}

export default function TagManagementPanel({
  existingTags,
  onClose,
  onRenameTag,
  onDeleteTag,
  onMergeTags,
  onConditionalTag,
}: TagManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'rename' | 'delete' | 'merge' | 'conditional'>('rename');

  // Rename state
  const [selectedTagToRename, setSelectedTagToRename] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Delete state
  const [selectedTagToDelete, setSelectedTagToDelete] = useState('');

  // Merge state
  const [selectedSourceTags, setSelectedSourceTags] = useState<string[]>([]);
  const [mergeTargetTag, setMergeTargetTag] = useState('');

  // Conditional state
  const [conditionTag, setConditionTag] = useState('');
  const [tagToAdd, setTagToAdd] = useState('');

  const handleRename = async () => {
    if (!selectedTagToRename || !newTagName.trim()) {
      alert('Please select a tag and enter a new name.');
      return;
    }

    await onRenameTag(selectedTagToRename, newTagName.trim());
    setSelectedTagToRename('');
    setNewTagName('');
  };

  const handleDelete = async () => {
    if (!selectedTagToDelete) {
      alert('Please select a tag to delete.');
      return;
    }

    await onDeleteTag(selectedTagToDelete);
    setSelectedTagToDelete('');
  };

  const handleMerge = async () => {
    if (selectedSourceTags.length === 0 || !mergeTargetTag.trim()) {
      alert('Please select source tags and enter a target tag.');
      return;
    }

    await onMergeTags(selectedSourceTags, mergeTargetTag.trim());
    setSelectedSourceTags([]);
    setMergeTargetTag('');
  };

  const handleConditional = async () => {
    if (!conditionTag || !tagToAdd.trim()) {
      alert('Please select a condition tag and enter a tag to add.');
      return;
    }

    await onConditionalTag(conditionTag, tagToAdd.trim());
    setConditionTag('');
    setTagToAdd('');
  };

  const toggleSourceTag = (tag: string) => {
    setSelectedSourceTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 bg-night/50 dark:bg-night/70 z-50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-paper dark:bg-cellar rounded-lg shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-pthalo dark:bg-fern text-paper dark:text-night px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            Tag Management
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-paper/20 dark:hover:bg-night/20 rounded"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-oak/20 dark:border-parchment/20 px-6 flex gap-4">
          <button
            onClick={() => setActiveTab('rename')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeTab === 'rename'
                ? 'border-pthalo dark:border-fern text-pthalo dark:text-fern font-medium'
                : 'border-transparent text-oak dark:text-parchment/60 hover:text-pthalo dark:hover:text-fern'
            }`}
          >
            Rename
          </button>
          <button
            onClick={() => setActiveTab('delete')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeTab === 'delete'
                ? 'border-pthalo dark:border-fern text-pthalo dark:text-fern font-medium'
                : 'border-transparent text-oak dark:text-parchment/60 hover:text-pthalo dark:hover:text-fern'
            }`}
          >
            Delete
          </button>
          <button
            onClick={() => setActiveTab('merge')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeTab === 'merge'
                ? 'border-pthalo dark:border-fern text-pthalo dark:text-fern font-medium'
                : 'border-transparent text-oak dark:text-parchment/60 hover:text-pthalo dark:hover:text-fern'
            }`}
          >
            Merge
          </button>
          <button
            onClick={() => setActiveTab('conditional')}
            className={`py-3 px-2 border-b-2 transition-colors ${
              activeTab === 'conditional'
                ? 'border-pthalo dark:border-fern text-pthalo dark:text-fern font-medium'
                : 'border-transparent text-oak dark:text-parchment/60 hover:text-pthalo dark:hover:text-fern'
            }`}
          >
            Conditional
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          {activeTab === 'rename' && (
            <div className="space-y-4">
              <p className="text-oak dark:text-parchment/80 text-sm">
                Rename a tag across all books in your library.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-1">
                  Select tag to rename:
                </label>
                <select
                  value={selectedTagToRename}
                  onChange={(e) => setSelectedTagToRename(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
                >
                  <option value="">-- Choose a tag --</option>
                  {existingTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-1">
                  New tag name:
                </label>
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter new name"
                  className="w-full px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
                />
              </div>

              <button
                onClick={handleRename}
                className="w-full px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night hover:bg-fern dark:hover:bg-pthalo transition-colors font-medium"
              >
                Rename Tag
              </button>
            </div>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-4">
              <p className="text-oak dark:text-parchment/80 text-sm">
                Delete a tag from all books in your library. This action cannot be undone.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-1">
                  Select tag to delete:
                </label>
                <select
                  value={selectedTagToDelete}
                  onChange={(e) => setSelectedTagToDelete(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
                >
                  <option value="">-- Choose a tag --</option>
                  {existingTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700 transition-colors font-medium"
              >
                Delete Tag
              </button>
            </div>
          )}

          {activeTab === 'merge' && (
            <div className="space-y-4">
              <p className="text-oak dark:text-parchment/80 text-sm">
                Merge multiple tags into a single target tag. Source tags will be removed.
              </p>
              
              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-2">
                  Select source tags to merge (click to toggle):
                </label>
                <div className="flex flex-wrap gap-2 p-3 border border-oak/30 dark:border-parchment/30 rounded bg-chalk dark:bg-night/50 min-h-[80px]">
                  {existingTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleSourceTag(tag)}
                      className={`px-3 py-1 rounded text-sm transition-colors ${
                        selectedSourceTags.includes(tag)
                          ? 'bg-pthalo dark:bg-fern text-paper dark:text-night'
                          : 'bg-paper dark:bg-cellar text-ink dark:text-parchment border border-oak/30 dark:border-parchment/30 hover:border-pthalo dark:hover:border-fern'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-1">
                  Target tag name:
                </label>
                <input
                  type="text"
                  value={mergeTargetTag}
                  onChange={(e) => setMergeTargetTag(e.target.value)}
                  placeholder="Enter target tag"
                  className="w-full px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
                />
              </div>

              <button
                onClick={handleMerge}
                className="w-full px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night hover:bg-fern dark:hover:bg-pthalo transition-colors font-medium"
              >
                Merge Tags
              </button>
            </div>
          )}

          {activeTab === 'conditional' && (
            <div className="space-y-4">
              <p className="text-oak dark:text-parchment/80 text-sm">
                Add a tag to all books that have a specific condition tag.
                <br />
                <span className="text-xs italic">Example: "Add 'reviewed' to all books with tag 'favorite'"</span>
              </p>
              
              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-1">
                  If book has tag:
                </label>
                <select
                  value={conditionTag}
                  onChange={(e) => setConditionTag(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
                >
                  <option value="">-- Choose condition tag --</option>
                  {existingTags.map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-ink dark:text-parchment mb-1">
                  Then add tag:
                </label>
                <input
                  type="text"
                  value={tagToAdd}
                  onChange={(e) => setTagToAdd(e.target.value)}
                  placeholder="Enter tag to add"
                  className="w-full px-3 py-2 rounded border border-oak/30 dark:border-parchment/30 bg-paper dark:bg-cellar text-ink dark:text-parchment"
                />
              </div>

              <button
                onClick={handleConditional}
                className="w-full px-4 py-2 rounded bg-pthalo dark:bg-fern text-paper dark:text-night hover:bg-fern dark:hover:bg-pthalo transition-colors font-medium"
              >
                Apply Conditional Tag
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
