import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../../utils'

const routeMap = {
  '/dashboard': 'Dashboard',
  '/profile': 'Profile',
}

const getBreadcrumbs = (pathname) => {
  const paths = pathname.split('/').filter(Boolean)
  // Home should point to '/' if on landing page, otherwise '/dashboard'
  const homePath = pathname === '/' ? '/' : '/dashboard'
  const breadcrumbs = [{ name: 'Home', path: homePath, icon: Home }]

  // If we're already on dashboard or root, don't add it again
  if (pathname === '/dashboard' || pathname === '/') {
    return breadcrumbs
  }

  let currentPath = ''
  
  paths.forEach((segment, index) => {
    currentPath += `/${segment}`
    const routeName = routeMap[currentPath]
    
    if (routeName) {
      breadcrumbs.push({
        name: routeName,
        path: currentPath,
        isLast: index === paths.length - 1,
      })
    } else {
      // Handle dynamic segments (e.g., IDs)
      breadcrumbs.push({
        name: segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '),
        path: currentPath,
        isLast: index === paths.length - 1,
      })
    }
  })

  return breadcrumbs
}

export const Breadcrumbs = ({ className, customItems }) => {
  const location = useLocation()
  const breadcrumbs = customItems || getBreadcrumbs(location.pathname)

  if (breadcrumbs.length <= 1) return null

  return (
    <nav 
      className={cn('flex items-center gap-1 sm:gap-2 text-sm text-muted-foreground mb-4 sm:mb-6', className)}
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center gap-1 sm:gap-2 flex-wrap" itemScope itemType="https://schema.org/BreadcrumbList">
        {breadcrumbs.map((crumb, index) => {
          const isLast = crumb.isLast || index === breadcrumbs.length - 1
          
          return (
            <li 
              key={`${crumb.path}-${index}`}
              className="flex items-center gap-1 sm:gap-2"
              itemProp="itemListElement"
              itemScope
              itemType="https://schema.org/ListItem"
            >
              {isLast ? (
                <span 
                  className="text-foreground font-medium"
                  itemProp="name"
                  aria-current="page"
                >
                  {index === 0 && crumb.icon ? (
                    <crumb.icon className="h-4 w-4 inline mr-1" />
                  ) : null}
                  {crumb.name}
                </span>
              ) : (
                <>
                  <Link
                    to={crumb.path}
                    className="hover:text-foreground transition-colors flex items-center gap-1"
                    itemProp="item"
                  >
                    {index === 0 && crumb.icon ? (
                      <crumb.icon className="h-4 w-4" />
                    ) : null}
                    <span itemProp="name">{crumb.name}</span>
                  </Link>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground/50" aria-hidden="true" />
                </>
              )}
              <meta itemProp="position" content={index + 1} />
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

export default Breadcrumbs

