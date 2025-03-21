import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import Strike from '@tiptap/extension-strike';
import Link from '@tiptap/extension-link';
import { BsTypeBold, BsTypeItalic, BsTypeUnderline, BsListUl, BsListOl, BsLink45Deg } from 'react-icons/bs';
import { HiMiniPencilSquare } from 'react-icons/hi2';
import { BiUndo, BiRedo } from 'react-icons/bi';
import { TbClearFormatting } from 'react-icons/tb';
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
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor = ({ value, onChange, placeholder = 'Add a note...' }: RichTextEditorProps) => {
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
          target: '_blank', // Abrir enlaces en nueva pestaña
          rel: 'noopener noreferrer', // Seguridad para enlaces externos
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none font-kalam',
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
    </>
  );
};

export default RichTextEditor; 