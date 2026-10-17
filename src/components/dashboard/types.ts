export type DashboardLink = {
  id: string;
  code: string;
  destination: string;
  shortUrl: string;
  createdAt: string;
  clickCount: number;
};

export type LinksListResponse = {
  items: DashboardLink[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  sort: "newest" | "oldest" | "most_clicked";
  search: string;
};

export type CreateLinkResponse = DashboardLink;
