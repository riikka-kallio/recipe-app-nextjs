'use client';

import React, { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Youtube from '@tiptap/extension-youtube';
import Audio from '@tiptap/extension-audio';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  Undo,
  Redo,
  ImageIcon,
  Link as LinkIcon,
  Youtube as YoutubeIcon,
  Mic,
} from 'lucide-react';
import { uploadService } from '@/lib/services/recipeService';
import AudioRecorder from '@/components/AudioRecorder';

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  content,
  onChange,
}) => {
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false, // Disable Link in StarterKit to avoid duplicate
      }),
      Image.configure({
        inline: true,
        allowBase64: false,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-forest-600 underline hover:text-forest-700',
        },
      }),
      Youtube.configure({
        controls: true,
        nocookie: true,
        HTMLAttributes: {
          class: 'w-full aspect-video rounded-lg my-4',
        },
      }),
      Audio.configure({
        HTMLAttributes: {
          controls: true,
          class: 'w-full my-4 rounded-lg',
        },
      }),
    ],
    content,
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-xl focus:outline-none min-h-[400px] p-4',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  const handleImageUpload = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setIsUploadingImage(true);
      try {
        const response = await uploadService.uploadImage(file);
        if (response.data) {
          // For Next.js, construct the URL to point to our API route
          const imageUrl = response.data.url;
          editor?.chain().focus().setImage({ src: imageUrl }).run();
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        alert('Failed to upload image. Please try again.');
      } finally {
        setIsUploadingImage(false);
      }
    };
    input.click();
  };

  const handleSetLink = () => {
    if (!linkUrl) {
      editor?.chain().focus().unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    editor
      ?.chain()
      .focus()
      .extendMarkRange('link')
      .setLink({ href: linkUrl })
      .run();

    setLinkUrl('');
    setShowLinkInput(false);
  };

  const handleAddVideo = () => {
    if (!videoUrl) {
      setShowVideoInput(false);
      return;
    }

    editor?.commands.setYoutubeVideo({
      src: videoUrl,
      width: 640,
      height: 360,
    });

    setVideoUrl('');
    setShowVideoInput(false);
  };

  const handleAudioUploaded = (audioUrl: string) => {
    editor?.commands.setAudio({ src: audioUrl });
    setShowAudioRecorder(false);
  };

  if (!editor) {
    return (
      <div className="border border-red-300 rounded-md p-4 bg-red-50">
        <p className="text-red-700 font-semibold">⚠️ Editor Initialization Failed</p>
        <p className="text-sm text-red-600 mt-2">
          The TipTap editor failed to initialize. Check the browser console for error details.
        </p>
      </div>
    );
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap gap-1" role="toolbar" aria-label="Text formatting toolbar">
        {/* Text Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('bold') ? 'bg-gray-300' : ''
          }`}
          title="Bold"
          type="button"
          aria-label="Bold"
        >
          <Bold className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('italic') ? 'bg-gray-300' : ''
          }`}
          title="Italic"
          type="button"
          aria-label="Italic"
        >
          <Italic className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleCode().run()}
          disabled={!editor.can().chain().focus().toggleCode().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('code') ? 'bg-gray-300' : ''
          }`}
          title="Code"
          type="button"
          aria-label="Code"
        >
          <Code className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Headings */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 1"
          type="button"
          aria-label="Heading 1"
        >
          <Heading1 className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 2"
          type="button"
          aria-label="Heading 2"
        >
          <Heading2 className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
          }`}
          title="Heading 3"
          type="button"
          aria-label="Heading 3"
        >
          <Heading3 className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Lists */}
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('bulletList') ? 'bg-gray-300' : ''
          }`}
          title="Bullet List"
          type="button"
          aria-label="Bullet list"
        >
          <List className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('orderedList') ? 'bg-gray-300' : ''
          }`}
          title="Numbered List"
          type="button"
          aria-label="Numbered list"
        >
          <ListOrdered className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('blockquote') ? 'bg-gray-300' : ''
          }`}
          title="Quote"
          type="button"
          aria-label="Block quote"
        >
          <Quote className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Media */}
        <button
          onClick={handleImageUpload}
          disabled={isUploadingImage}
          className="p-2 rounded hover:bg-gray-200"
          title="Upload Image"
          type="button"
          aria-label="Upload image"
        >
          {isUploadingImage ? (
            <span className="text-xs">Uploading...</span>
          ) : (
            <ImageIcon className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={`p-2 rounded hover:bg-gray-200 ${
            editor.isActive('link') ? 'bg-gray-300' : ''
          }`}
          title="Add Link"
          type="button"
          aria-label="Add link"
        >
          <LinkIcon className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => setShowVideoInput(!showVideoInput)}
          className="p-2 rounded hover:bg-gray-200"
          title="Embed Video"
          type="button"
          aria-label="Embed YouTube video"
        >
          <YoutubeIcon className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => setShowAudioRecorder(!showAudioRecorder)}
          className="p-2 rounded hover:bg-gray-200"
          title="Record Audio"
          type="button"
          aria-label="Record audio"
        >
          <Mic className="w-4 h-4" aria-hidden="true" />
        </button>

        <div className="w-px bg-gray-300 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Undo"
          type="button"
          aria-label="Undo"
        >
          <Undo className="w-4 h-4" aria-hidden="true" />
        </button>
        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          title="Redo"
          type="button"
          aria-label="Redo"
        >
          <Redo className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Link Input */}
      {showLinkInput && (
        <div className="bg-blue-50 border-b border-gray-300 p-3 flex gap-2">
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="Enter URL (e.g., https://example.com)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSetLink();
              }
            }}
          />
          <button
            onClick={handleSetLink}
            className="px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700"
            type="button"
          >
            Set Link
          </button>
          <button
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Video Input */}
      {showVideoInput && (
        <div className="bg-blue-50 border-b border-gray-300 p-3 flex gap-2">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="Enter YouTube or Vimeo URL"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddVideo();
              }
            }}
          />
          <button
            onClick={handleAddVideo}
            className="px-4 py-2 bg-forest-600 text-white rounded-md hover:bg-forest-700"
            type="button"
          >
            Embed Video
          </button>
          <button
            onClick={() => {
              setShowVideoInput(false);
              setVideoUrl('');
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
            type="button"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Audio Recorder */}
      {showAudioRecorder && (
        <div className="border-b border-gray-300 p-3">
          <AudioRecorder
            onAudioUploaded={handleAudioUploaded}
            onCancel={() => setShowAudioRecorder(false)}
          />
        </div>
      )}

      {/* Editor Content */}
      <EditorContent editor={editor} className="bg-white" />
    </div>
  );
};

export default TipTapEditor;
