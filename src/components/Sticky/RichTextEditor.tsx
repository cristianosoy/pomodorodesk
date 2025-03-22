import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Strike from '@tiptap/extension-strike';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { BsTypeBold, BsTypeItalic, BsTypeUnderline, BsListUl, BsListOl, BsLink45Deg, BsImage } from 'react-icons/bs';
import { HiMiniPencilSquare } from 'react-icons/hi2';
import { BiUndo, BiRedo } from 'react-icons/bi';
import { TbClearFormatting } from 'react-icons/tb';
import { ImageModal } from './ImageModal';
import { useState } from 'react';
import { useStickyNote } from '@Store';
import './RichTextEditor.scss';

// Importar fuente Kalam
const KalamFont = () => {
  return (
    <link
      href="https://fonts.googleapis.com/css2?family=Kalam:wght@300;400;700&display=swap"
      rel="stylesheet"
    />
  );
};

interface RichTextEditorProps {
  id: number;
  initialText: string;
  placeholder?: string;
}

const RichTextEditor = ({ id, initialText, placeholder = 'Add a note...' }: RichTextEditorProps) => {
  const { editNote, stickyNotes } = useStickyNote();
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const currentNote = stickyNotes.find(note => note.id === id);

  const handleTextChange = (newText: string) => {
    editNote(id, newText);
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'bullet-list',
          },
          keepMarks: true,
          keepAttributes: false,
        },
        orderedList: {
          HTMLAttributes: {
            class: 'ordered-list',
          },
          keepMarks: true,
          keepAttributes: false,
        },
      }),
      Underline,
      Strike,
      Highlight.configure({ multicolor: false }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'note-link',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'note-image',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: initialText,
    onUpdate: ({ editor }) => {
      handleTextChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none font-kalam',
      },
      handlePaste: (view, event) => {
        // Manejar imágenes pegadas desde el portapapeles
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of Array.from(items)) {
            if (item.type.indexOf('image') === 0) {
              event.preventDefault();
              
              const blob = item.getAsFile();
              if (blob) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const result = e.target?.result;
                  if (typeof result === 'string') {
                    editor?.chain().focus().setImage({ src: result }).run();
                  }
                };
                reader.readAsDataURL(blob);
                return true;
              }
            }
          }
        }
        return false;
      },
      handleClick: (view, pos, event) => {
        const target = event.target as HTMLElement;
        // Verificar si el clic fue en una imagen o en su contenedor
        if (target.tagName === 'IMG' || target.querySelector('img')) {
          const img = target.tagName === 'IMG' ? target : target.querySelector('img');
          if (img) {
            setSelectedImage((img as HTMLImageElement).src);
            setShowImageModal(true);
            return true;
          }
        }
        return false;
      },
    },
  });

  if (!editor) {
    return null;
  }

  const toggleListType = (type: 'bulletList' | 'orderedList') => {
    if (type === 'orderedList') {
      editor.chain().focus().toggleOrderedList().run();
    } else {
      editor.chain().focus().toggleBulletList().run();
    }
  };

  // Función para añadir un enlace
  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // Cancelar operación si se cerró el prompt
    if (url === null) {
      return;
    }

    // Si el campo está vacío, eliminar el enlace
    if (url === '') {
      editor.chain().focus().unsetMark('link').run();
      return;
    }

    // Validar que sea una URL válida
    let finalUrl = url;
    if (!/^https?:\/\//i.test(url)) {
      finalUrl = `https://${url}`;
    }

    // Establecer el enlace
    editor
      .chain()
      .focus()
      .extendMarkRange('link')
      .setMark('link', { href: finalUrl, target: '_blank' })
      .run();
  };

  // Función para añadir una imagen
  const addImage = () => {
    const url = window.prompt('URL de la imagen');
    
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <>
      <KalamFont />
      <div className="rich-text-editor">
        <div className="editor-toolbar">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            type="button"
            title="Undo"
          >
            <BiUndo size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            type="button"
            title="Redo"
          >
            <BiRedo size={16} />
          </button>
          <div className="toolbar-separator" />
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            type="button"
            title="Bold"
          >
            <BsTypeBold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            type="button"
            title="Italic"
          >
            <BsTypeItalic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            type="button"
            title="Underline"
          >
            <BsTypeUnderline size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            type="button"
            title="Strike"
          >
            S
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={editor.isActive('highlight') ? 'is-active' : ''}
            type="button"
            title="Highlight"
          >
            <HiMiniPencilSquare size={16} />
          </button>
          <button
            onClick={setLink}
            className={editor.isActive('link') ? 'is-active' : ''}
            type="button"
            title="Add or Edit Link"
          >
            <BsLink45Deg size={16} />
          </button>
          <button
            onClick={addImage}
            type="button"
            title="Añadir imagen"
          >
            <BsImage size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().unsetAllMarks().run()}
            type="button"
            title="Clear Formatting"
          >
            <TbClearFormatting size={16} />
          </button>
          <div className="toolbar-separator" />
          <button
            onClick={() => toggleListType('bulletList')}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            type="button"
            title="Bullet List"
          >
            <BsListUl size={16} />
          </button>
          <button
            onClick={() => toggleListType('orderedList')}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            type="button"
            title="Numbered List"
          >
            <BsListOl size={16} />
          </button>
        </div>
        <div className="editor-content">
          <EditorContent editor={editor} />
        </div>
      </div>
      <ImageModal 
        isVisible={showImageModal}
        imageUrl={selectedImage}
        onClose={() => setShowImageModal(false)}
      />
    </>
  );
};

export default RichTextEditor; 