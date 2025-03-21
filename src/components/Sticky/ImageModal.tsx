import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import './ImageModal.scss';

interface ImageModalProps {
  isVisible: boolean;
  imageUrl: string;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isVisible, imageUrl, onClose }) => {
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isVisible]);

  if (!isVisible) return null;

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -0.01;
    const newScale = Math.max(0.1, Math.min(10, scale + delta));
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).className === 'image-modal-content') {
      onClose();
    }
  };

  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const modalContent = (
    <div 
      className="image-modal-overlay"
      onClick={handleBackdropClick}
      onMouseUp={handleMouseUp}
      onMouseMove={handleMouseMove}
    >
      <div className="image-modal-controls">
        <button onClick={resetView} className="image-modal-button">
          Restablecer
        </button>
        <button onClick={onClose} className="image-modal-button image-modal-close">
          Cerrar
        </button>
      </div>
      <div 
        className="image-modal-content" 
        onWheel={handleWheel}
        onClick={handleBackdropClick}
      >
        <img
          src={imageUrl}
          alt="Vista ampliada"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          draggable={false}
        />
      </div>
      <div className="image-modal-zoom-info">
        Zoom: {Math.round(scale * 100)}%
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}; 