import React from 'react'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export const Table: React.FC<TableProps> = ({ children, className = '' }) => {
  return (
    <div className="overflow-x-auto my-8">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <table className={`w-full border-separate border-spacing-0 ${className}`}>
          {children}
        </table>
      </div>
    </div>
  )
}

interface TableHeadProps {
  children: React.ReactNode
  className?: string
}

export const TableHead: React.FC<TableHeadProps> = ({ children, className = '' }) => {
  return (
    <thead className={`bg-gray-100 dark:bg-gray-700 ${className}`}>
      {children}
    </thead>
  )
}

interface TableBodyProps {
  children: React.ReactNode
  className?: string
}

export const TableBody: React.FC<TableBodyProps> = ({ children, className = '' }) => {
  return (
    <tbody className={className}>
      {children}
    </tbody>
  )
}

interface TableRowProps {
  children: React.ReactNode
  className?: string
}

export const TableRow: React.FC<TableRowProps> = ({ children, className = '' }) => {
  return (
    <tr className={`border-b border-gray-200 dark:border-gray-700 last:border-0 ${className}`}>
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: React.ReactNode
  className?: string
  isHeader?: boolean
}

export const TableCell: React.FC<TableCellProps> = ({ 
  children, 
  className = '', 
  isHeader = false 
}) => {
  const baseStyles = 'p-4 whitespace-nowrap'
  const headerStyles = 'font-medium text-gray-900 dark:text-white text-left'
  const cellStyles = 'text-gray-700 dark:text-gray-300'

  const styles = `${baseStyles} ${isHeader ? headerStyles : cellStyles} ${className}`

  return isHeader ? (
    <th className={styles} scope="col">{children}</th>
  ) : (
    <td className={styles}>{children}</td>
  )
} 