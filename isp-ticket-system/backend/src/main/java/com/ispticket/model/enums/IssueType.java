package com.ispticket.model.enums;

public enum IssueType {
    NO_INTERNET(Category.SUPPORT, Priority.URGENT),
    SLOW_SPEED(Category.SUPPORT, Priority.NORMAL),
    BILLING(Category.SUPPORT, Priority.LOW),
    ROUTER_ISSUE(Category.SUPPORT, Priority.NORMAL),
    FIBER_CUT(Category.FIBER_INSTALL, Priority.URGENT),
    NEW_INSTALL(Category.FIBER_INSTALL, Priority.NORMAL),
    RELOCATION(Category.FIBER_INSTALL, Priority.NORMAL),
    OTHER(Category.SUPPORT, Priority.LOW);

    private final Category defaultCategory;
    private final Priority defaultPriority;

    IssueType(Category defaultCategory, Priority defaultPriority) {
        this.defaultCategory = defaultCategory;
        this.defaultPriority = defaultPriority;
    }

    public Category getDefaultCategory() {
        return defaultCategory;
    }

    public Priority getDefaultPriority() {
        return defaultPriority;
    }
}
