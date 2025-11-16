import type { StateCreator } from 'zustand';
import type { Card, Notification, TooltipData } from '../../types';

export interface UISlice {
  ui: {
    selectedCard: Card | null;
    hoveredCard: Card | null;
    draggedCard: Card | null;
    modals: {
      slotUpgrade: boolean;
      gameOver: boolean;
      settings: boolean;
    };
    notifications: Notification[];
    isLoading: boolean;
    tooltipData: TooltipData | null;
  };

  // Actions
  selectCard: (card: Card | null) => void;
  setHoveredCard: (card: Card | null) => void;
  setDraggedCard: (card: Card | null) => void;
  openModal: (modal: keyof UISlice['ui']['modals']) => void;
  closeModal: (modal: keyof UISlice['ui']['modals']) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setTooltip: (data: TooltipData | null) => void;
}

const initialUIState = {
  selectedCard: null,
  hoveredCard: null,
  draggedCard: null,
  modals: {
    slotUpgrade: false,
    gameOver: false,
    settings: false,
  },
  notifications: [] as Notification[],
  isLoading: false,
  tooltipData: null,
};

export const createUISlice: StateCreator<UISlice> = (set) => ({
  ui: initialUIState,

  selectCard: (card) => set((state) => ({
    ui: { ...state.ui, selectedCard: card }
  })),

  setHoveredCard: (card) => set((state) => ({
    ui: { ...state.ui, hoveredCard: card }
  })),

  setDraggedCard: (card) => set((state) => ({
    ui: { ...state.ui, draggedCard: card }
  })),

  openModal: (modal) => set((state) => ({
    ui: { ...state.ui, modals: { ...state.ui.modals, [modal]: true } }
  })),

  closeModal: (modal) => set((state) => ({
    ui: { ...state.ui, modals: { ...state.ui.modals, [modal]: false } }
  })),

  addNotification: (notification) => set((state) => ({
    ui: {
      ...state.ui,
      notifications: [
        ...state.ui.notifications,
        { ...notification, id: `${Date.now()}-${Math.random()}` },
      ],
    }
  })),

  removeNotification: (id) => set((state) => ({
    ui: {
      ...state.ui,
      notifications: state.ui.notifications.filter(n => n.id !== id),
    }
  })),

  setLoading: (loading) => set((state) => ({
    ui: { ...state.ui, isLoading: loading }
  })),

  setTooltip: (data) => set((state) => ({
    ui: { ...state.ui, tooltipData: data }
  })),
});
