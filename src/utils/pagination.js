const getPaginationOptions = (query) => {
    let page = parseInt(query.page);
    let limit = parseInt(query.limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;
    
    // Cap limit to prevent abuse
    if (limit > 100) limit = 100;

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

const formatPaginatedResponse = (data, totalCount, page, limit) => {
    return {
        data,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        currentPage: page,
        pageSize: limit
    };
};

module.exports = {
    getPaginationOptions,
    formatPaginatedResponse
};
