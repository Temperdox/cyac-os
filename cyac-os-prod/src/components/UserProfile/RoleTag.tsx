import React from 'react';
import styles from './RoleTag.module.css';

interface RoleTagProps {
    name: string;
    color: string;
    icon?: string;
}

const RoleTag: React.FC<RoleTagProps> = ({ name, color, icon }) => {
    return (
        <div
            className={styles.roleTag}
            style={{
                borderColor: color,
                backgroundColor: `${color}15` // 15 is hex for opacity ~8%
            }}
        >
            {icon && (
                <div className={styles.roleIcon}>
                    <img src={icon} alt="" />
                </div>
            )}
            <span
                className={styles.roleName}
                style={{ color }}
            >
        {name}
      </span>
        </div>
    );
};

export default RoleTag;