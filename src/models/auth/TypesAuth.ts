export interface User {
  id: number;
  username: string;
  password: string; // 需加密存儲
  email?: string;
  status: boolean; // true: 啟用, false: 停用
  createdAt: Date;
  updatedAt: Date;
}

export interface Group {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Role {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Route {
  id: number;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  createdAt: Date;
  updatedAt: Date;
}

export interface Menu {
  id: number;
  name: string;
  parentId?: number | null; // 可選，對應父菜單 ID
  routeId?: number | null; // 可選，對應 Route ID
  createdAt: Date;
  updatedAt: Date;
}

export interface GroupRole {
  groupId: number;
  roleId: number;
}

export interface GroupUser {
  groupId: number;
  userId: number;
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
}

export interface MenuGroup {
  groupId: number;
  menuId: number;
}
