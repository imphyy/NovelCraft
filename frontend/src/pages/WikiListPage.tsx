import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { wikiAPI } from '../api/client';
import type { WikiPage, WikiPageType } from '../types/wiki';
import { WIKI_PAGE_TYPES } from '../types/wiki';

export default function WikiListPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();

  const [pages, setPages] = useState<WikiPage[]>([]);
  const [filteredPages, setFilteredPages] = useState<WikiPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<WikiPageType | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [pageType, setPageType] = useState<WikiPageType>('character');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadPages();
  }, [projectId]);

  useEffect(() => {
    if (selectedType === 'all') {
      setFilteredPages(pages);
    } else {
      setFilteredPages(pages.filter(p => p.pageType === selectedType));
    }
  }, [selectedType, pages]);

  const loadPages = async () => {
    try {
      const response = await wikiAPI.list(projectId!);
      setPages(response.data);
    } catch (err) {
      console.error('Failed to load wiki pages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreating(true);

    try {
      const response = await wikiAPI.create(projectId!, title, pageType);
      const newPage = response.data;
      setPages([newPage, ...pages]);
      setShowCreateModal(false);
      setTitle('');
      navigate(`/projects/${projectId}/wiki/${newPage.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create page');
    } finally {
      setCreating(false);
    }
  };

  const getTypeIcon = (type: WikiPageType) => {
    return WIKI_PAGE_TYPES.find(t => t.value === type)?.icon || '📄';
  };

  const getTypeCount = (type: WikiPageType) => {
    return pages.filter(p => p.pageType === type).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading wiki...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Wiki</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            New Page
          </button>
        </div>
      </div>

      {/* Type Filter */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedType('all')}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedType === 'all'
                ? 'bg-indigo-100 text-indigo-700 font-medium'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            All ({pages.length})
          </button>
          {WIKI_PAGE_TYPES.map(type => (
            <button
              key={type.value}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
                selectedType === type.value
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {type.icon} {type.label} ({getTypeCount(type.value)})
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {filteredPages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">
              {selectedType === 'all'
                ? 'No wiki pages yet'
                : `No ${WIKI_PAGE_TYPES.find(t => t.value === selectedType)?.label.toLowerCase()}s yet`
              }
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create your first page
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPages.map(page => (
              <div
                key={page.id}
                onClick={() => navigate(`/projects/${projectId}/wiki/${page.id}`)}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getTypeIcon(page.pageType)}</span>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {page.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {WIKI_PAGE_TYPES.find(t => t.value === page.pageType)?.label}
                    </p>
                    {page.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {page.tags.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {page.tags.length > 3 && (
                          <span className="px-2 py-0.5 text-gray-500 text-xs">
                            +{page.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Create Wiki Page
            </h3>
            <form onSubmit={handleCreatePage}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Page Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Character name, location, etc."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Page Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {WIKI_PAGE_TYPES.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setPageType(type.value)}
                        className={`px-3 py-2 rounded-md text-sm font-medium border ${
                          pageType === type.value
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {type.icon} {type.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setError('');
                    setTitle('');
                  }}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create Page'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
