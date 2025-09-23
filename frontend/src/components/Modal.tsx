import React, { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ''
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content-new ${className}`} onClick={(e) => e.stopPropagation()}>
        <button 
          className="modal-close"
          onClick={onClose}
        >
          ×
        </button>
        
        {title && (
          <div className="modal-header">
            <h3>{title}</h3>
          </div>
        )}
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
