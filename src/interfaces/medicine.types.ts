export interface RxRequired {
  header: string;
  icon_url: string;
}

export interface CartAction {
  action_label: string;
  final_label: string;
  label: string;
}

export interface CartActions {
  dweb: string[];
  mweb: string[];
}

export interface InStock {
  add: CartAction;
  cart_actions: CartActions;
}

export interface Medicine {
  is_discontinued: boolean;
  manufacturer_name: string;
  marketer_name: string;
  type: string;
  price: number;
  name: string;
  id: number;
  sku_id: number;
  available: boolean;
  pack_size_label: string;
  rx_required: RxRequired;
  slug: string;
  short_composition: string;
  image_url: string;
  in_stock: InStock;
  quantity: number;
}

export interface MainTopicMessage {
  medicines: Medicine[];
}
