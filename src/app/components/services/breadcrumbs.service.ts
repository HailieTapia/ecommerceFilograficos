import { Injectable } from '@angular/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbsService {
  private breadcrumbsSubject = new BehaviorSubject<any[]>([]);
  breadcrumbs$ = this.breadcrumbsSubject.asObservable();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.buildBreadcrumbs(this.activatedRoute.root))
      )
      .subscribe((breadcrumbs) => {
        this.breadcrumbsSubject.next(breadcrumbs);
      });
  }

  private buildBreadcrumbs(
    route: ActivatedRoute,
    url: string = '',
    breadcrumbs: any[] = []
  ): any[] {
    const children: ActivatedRoute[] = route.children;

    if (children.length === 0) {
      return breadcrumbs;
    }

    for (const child of children) {
      const routeURL: string = child.snapshot.url
        .map((segment) => segment.path)
        .join('/');
      if (routeURL !== '') {
        url += `/${routeURL}`;
      }

      const label = child.snapshot.data['breadcrumb'];
      if (label) {
        breadcrumbs.push({ label, url });
      }

      return this.buildBreadcrumbs(child, url, breadcrumbs);
    }

    return breadcrumbs;
  }
}